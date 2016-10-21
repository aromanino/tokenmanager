var express = require('express');
var conf=require('./config').conf;
var request = require('request');
var _=require("underscore");
var moment = require('moment');
var jwt = require('jwt-simple');
var async=require('async');
var currentRoles={};

exports.checkAuthorization =  function(req, res, next) {

    var token = (req.body && req.body.access_token) || (req.query && req.query.access_token); // || req.headers['x-access-token'];
    if (req.headers['authorization']) {
        var value = req.headers['authorization'];
        header = value.split(" ");
        if (header.length == 2)
            if (header[0] == "Bearer") {
                token = header[1];
            }
    }

    var exampleUrl = conf.exampleUrl;

    if (token) {

            var URI;
            var path = (req.route.path == "/") ? "" : req.route.path;
            if (_.isEmpty(req.baseUrl))
                URI = req.path + path;
            else
                URI = req.baseUrl + path;

        if(conf.authorizationMicroservice.url) { // microservice use
            var rqparams = {
                url: conf.authorizationMicroservice.url + '/tokenactions/checkiftokenisauth',
                headers: {
                    'Authorization': "Bearer " + conf.authorizationMicroservice.access_token,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({decode_token: token, URI: URI, method: req.method})
            };


            var decoded = null;

            request.post(rqparams, function (error, response, body) {


                if (error) {
                    console.log("ERROR:" + error);
                    return res.status(500).send({error: 'internal_microservice_error', error_message: error + " "});
                } else {

                    decoded = JSON.parse(body);

                    if (_.isUndefined(decoded.valid)) {
                        return res.status(response.statusCode).send({
                            error: decoded.error,
                            error_message: decoded.error_message
                        });
                    } else {
                        if (decoded.valid == true) {
                            req[conf.decodedTokenFieldName] = decoded.token;
                            next();
                        } else {
                            return res.status(401).send({error: 'Unauthorized', error_message: decoded.error_message});
                        }
                    }
                }
            });
        }else{ // local Use
            var decoded=this.decodeToken(token);
            if(decoded.valid){
                var tokenType=decoded.tokenTypeClass;
                var role=currentRoles[URI][req.method.toUpperCase()];
                if(role) {
                    if (_.contains(role, tokenType)) {
                        req[conf.decodedTokenFieldName] = decoded;
                        next();
                    } else {
                        return res.status(401).send({error: 'Unauthorized', error_message: decoded.error_message});
                    }
                }else{
                    return res.status(401).send({
                        error: "BadRequest",
                        error_message: "No auth roles defined for: " + req.method + " " + URI
                    });
                }

            }else{
               return res.status(400).send({error:"BadRequest", error_message:"token invalid or malformed"})
            }
        }

    } else {
        return res.status(400)
            .set({'WWW-Authenticate':'Bearer realm='+exampleUrl+', error="invalid_request", error_message="The access token is required"'})
            .send({error:"invalid_request",error_message:"Unauthorized: Access token required, you are not allowed to use the resource"});
    }

};

exports.configure =  function(config) {
    conf.decodedTokenFieldName= config.decodedTokenFieldName || conf.decodedTokenFieldName;
    conf.authorizationMicroservice.url=config.authorizationMicroserviceUrl || conf.authorizationMicroservice.url;
    conf.authorizationMicroservice.access_token=config.authorizationMicroserviceToken || conf.authorizationMicroservice.access_token;
    conf.exampleUrl = config.exampleUrl || conf.exampleUrl;
    conf.tokenFieldName= config.tokenFieldName || conf.tokenFieldName;
    conf.secret= config.secret || conf.secret;
};

exports.encodeToken = function(dictionaryToEncode,tokenTypeClass,validFor){

    var expires = moment().add(validFor.unit, validFor.value).valueOf();
    dictionaryToEncode.exp=expires;
    dictionaryToEncode.tokenTypeClass=tokenTypeClass;

    var token = jwt.encode(dictionaryToEncode, conf.secret);

    var encodedToken = {
         token:token,
         expires: expires
    };
    return encodedToken;
};

exports.decodeToken = function(token){

    try {
        var decoded = jwt.decode(token, conf.secret);
        decoded.valid=true;
        return(decoded);
    } catch (err) {
        return ({
           valid:false,
           error_message:"The access_token is invalid or malformed"
        });
    }
};

exports.addRole=function(roles){
    var role,method;
    async.eachSeries(roles,function(value,callback){
        role=currentRoles[value.URI]||{POST:[],GET:[],PUT:[],DELETE:[]};
        method=value.method.toUpperCase();
        if (method=="DEL") method= "DELETE";
        role[method]=value.authToken;
        currentRoles[value.URI]=role;
        callback();
    });
};


exports.upgradeRole=function(roles){

    async.eachSeries(roles,function(value,callback){
        role=currentRoles[value.URI]||{POST:[],GET:[],PUT:[],DELETE:[]};
        method=value.method.toUpperCase();
        if (method=="DEL") method= "DELETE";
        newRole=role[method].concat(value.authToken);
        role[method]=newRole;
        currentRoles[value.URI]=role;
        callback();
    });
};



exports.downgradeRole=function(roles){

    async.eachSeries(roles,function(value,callback){
        role=currentRoles[value.URI]||{POST:[],GET:[],PUT:[],DELETE:[]};
        method=value.method.toUpperCase();
        if (method=="DEL") method= "DELETE";
        newRole=_.difference(role[method],value.authToken);
        role[method]=newRole;
        currentRoles[value.URI]=role;
        callback();
    });
};


exports.getRoles=function(){
    return(JSON.parse(currentRoles));
};

exports.resetRoles=function(){
    currentRoles={};
};