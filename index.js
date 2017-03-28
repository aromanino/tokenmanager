var express = require('express');
var conf=require('./config').conf;
var request = require('request');
var _=require("underscore");
var moment = require('moment');
var jwt = require('jwt-simple');
var async=require('async');
var currentRoles={};


exports.checkTokenValidity= function(req,res,next){
    conf.answerOnTheFly=true;
    checkTokenValidityFunction(req, res, next);
};

exports.checkTokenValidityOnReq= function(req,res,next){
    conf.answerOnTheFly=false;
    checkTokenValidityFunction(req, res, next);
};

exports.checkAuthorization= function(req,res,next){
    conf.answerOnTheFly=true;
    checkAuthorizationFunction(req, res, next);
};

exports.checkAuthorizationOnReq= function(req,res,next){
    conf.answerOnTheFly=false;
    checkAuthorizationFunction(req, res, next);
};


function checkTokenValidityFunction(req, res, next) {

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
        if(conf.authorizationMicroservice.tokenValidityUrl) { // microservice use
            var rqparams = {
                url: conf.authorizationMicroservice.tokenValidityUrl,
                headers: {
                    'Authorization': "Bearer " + conf.authorizationMicroservice.access_token,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({decode_token: token})
            };
            let decoded = null;

            request.post(rqparams, function (error, response, body) {

                if (error) {
                    console.log("ERROR:" + error);
                    if(!(conf.answerOnTheFly)){
                        req[conf.decodedTokenFieldName]={
                                error_code:"1",
                                error: 'InternalError',
                                error_message: error + " ",
                                valid:false
                        };
                        next();
                    }else {
                        return res.status(500).send({
                            error: 'InternalError',
                            error_message: error + " ",
                            error_code:"2",
                            valid:false
                        });
                    }
                } else {

                    decoded = JSON.parse(body);

                    if (decoded.valid == true) {
                        req[conf.decodedTokenFieldName] = decoded.token;
                        next();
                    } else {
                        if(!(conf.answerOnTheFly)){
                            req[conf.decodedTokenFieldName]={
                                valid:false,
                                error_code:"2",
                                error: 'BadRequest',
                                error_message: decoded.error_message
                            };
                            next();
                        }else {
                            return res.status(401).send({
                                valid:false,
                                error: 'BadRequest',
                                error_code:"2",
                                error_message: decoded.error_message
                            });
                        }
                    }

                }
            });
        }else{ // local Use
            let decoded=decodeToken(token);
            if(decoded.valid){
                req[conf.decodedTokenFieldName] = decoded;
                next();
            }else{
                if(!(conf.answerOnTheFly)){
                    req[conf.decodedTokenFieldName]={
                        valid:false,
                        error_code:"2",
                        error: "BadRequest",
                        error_message: decoded.error_message
                    };
                    next();
                }else {
                    return res.status(400).send({
                        valid:false,
                        error: "BadRequest",
                        error_message: decoded.error_message,
                        error_code:"2",
                    })
                }
            }
        }

    } else {
        if(!(conf.answerOnTheFly)){
            req[conf.decodedTokenFieldName]={
                valid:false,
                error_code: "0",
                error:"BadRequest",
                error_message: "Unauthorized: Access token required, you are not allowed to use the resource"
            };
            next();
        }else {
            return res.status(400)
                .set({'WWW-Authenticate': 'Bearer realm=' + exampleUrl + ', error="invalid_request", error_message="The access token is required"'})
                .send({
                    error: "BadRequest",
                    error_code: "0",
                    error_message: "Unauthorized: Access token required, you are not allowed to use the resource",
                    valid:false
                });
        }
    }

};



function checkAuthorizationFunction(req, res, next) {

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


        var path= (_.isEmpty(req.route)) ?  req.path : req.route.path;
        var URI=(_.isEmpty(req.baseUrl)) ? path : (req.baseUrl+path) ;
        URI=URI.endsWith("/") ? URI : URI+"/";


        if(conf.authorizationMicroservice.url) { // microservice use
            var rqparams = {
                url: conf.authorizationMicroservice.url,
                headers: {
                    'Authorization': "Bearer " + conf.authorizationMicroservice.access_token,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({decode_token: token, URI: URI, method: req.method})
            };


            let decoded = null;

            request.post(rqparams, function (error, response, body) {


                if (error) {
                    if(!(conf.answerOnTheFly)){
                        req[conf.decodedTokenFieldName]={valid:false,error: 'InternalError', error_message: error + " "};
                        next();
                    }else {
                        return res.status(500).send({valid:false,error: 'InternalError', error_message: error + " "});
                    }
                } else {

                    decoded = JSON.parse(body);

                    if (_.isUndefined(decoded.valid)) {
                        if(!(conf.answerOnTheFly)){
                            req[conf.decodedTokenFieldName]={
                                error: decoded.error,
                                error_message: decoded.error_message,
                                valid:false
                            };
                            next();
                        }else {
                        return res.status(response.statusCode).send({
                            error: decoded.error,
                            error_message: decoded.error_message
                        });
                        }
                    } else {
                        if (decoded.valid == true) {
                            req[conf.decodedTokenFieldName] = decoded.token;
                            next();
                        } else {
                            if(!(conf.answerOnTheFly)){
                                req[conf.decodedTokenFieldName]={
                                    error: 'Unauthorized',
                                    error_message: decoded.error_message,
                                    valid:false
                                };
                                next();
                            }else {
                                return res.status(401).send({
                                    error: 'Unauthorized',
                                    error_message: decoded.error_message,
                                    valid:false
                                });
                            }
                        }
                    }
                }
            });
        }else{ // local Use
            let decoded=decodeToken(token);
            if(decoded.valid){
                var tokenType=decoded.tokenTypeClass;
                try {
                    var role = currentRoles[URI][req.method.toUpperCase()];
                    if (role) {
                        if (_.contains(role, tokenType)) {
                            req[conf.decodedTokenFieldName] = decoded;
                            next();
                        } else {
                            if(!(conf.answerOnTheFly)){
                                req[conf.decodedTokenFieldName]={
                                    error: 'Unauthorized',
                                    error_message: "You are not authorized to access this resource",
                                    valid:false
                                };
                                next();
                            }else {
                                return res.status(401).send({
                                    error: 'Unauthorized',
                                    error_message: "You are not authorized to access this resource",
                                    valid:false
                                });
                            }
                        }
                    } else {
                        if(!(conf.answerOnTheFly)){
                            req[conf.decodedTokenFieldName]={
                                error: "BadRequest",
                                error_message: "No auth roles defined for: " + req.method + " " + URI,
                                valid:false
                            };
                            next();
                        }else {
                            return res.status(401).send({
                                error: "BadRequest",
                                error_message: "No auth roles defined for: " + req.method + " " + URI,
                                valid:false
                            });
                        }
                    }
                } catch (ex){
                    if(!(conf.answerOnTheFly)){
                        req[conf.decodedTokenFieldName]={
                            error: "BadRequest",
                            error_message: "No auth roles defined for: " + req.method + " " + URI,
                            valid:false
                        };
                        next();
                    }else {
                        return res.status(401).send({
                            error: "BadRequest",
                            error_message: "No auth roles defined for: " + req.method + " " + URI,
                            valid:false
                        });
                    }
                }

            }else{
                if(!(conf.answerOnTheFly)){
                    req[conf.decodedTokenFieldName]={valid:false,error: "BadRequest", error_message: decoded.error_message};
                    next();
                }else {
                    return res.status(400).send({valid:false,error: "BadRequest", error_message: decoded.error_message})
                }
            }
        }

    } else {
        if(!(conf.answerOnTheFly)){
            req[conf.decodedTokenFieldName]={
                error: "invalid_request",
                error_message: "Unauthorized: Access token required, you are not allowed to use the resource",
                valid:false
            };
            next();
        }else {
            return res.status(400)
                .set({'WWW-Authenticate': 'Bearer realm=' + exampleUrl + ', error="invalid_request", error_message="The access token is required"'})
                .send({
                    error: "invalid_request",
                    error_message: "Unauthorized: Access token required, you are not allowed to use the resource",
                    valid:false
                });
        }
    }

};



exports.testAuth=function(token,URI,method,callback){
    var decoded=decodeToken(token);
    URI=URI.endsWith("/") ? URI : URI+"/";
    if(decoded.valid){
        var tokenType=decoded.tokenTypeClass;
        var role=currentRoles[URI][method.toUpperCase()];
        if(role) {
            if (_.contains(role, tokenType)) {
                callback(null,decoded)
            } else {
                return callback(401,{error: 'Unauthorized', error_message:"You are not authorized to access this resource" });
            }
        }else{
            return callback(401,{
                error: "BadRequest",
                error_message: "No auth roles defined for: " + req.method + " " + URI
            });
        }
    }else{
        return callback(400,{error:"BadRequest", error_message:decoded.error_message});
    }
};

exports.configure =  function(config) {
    conf.decodedTokenFieldName= config.decodedTokenFieldName || conf.decodedTokenFieldName;
    conf.authorizationMicroservice.url=config.authorizationMicroserviceUrl || conf.authorizationMicroservice.url;
    conf.authorizationMicroservice.tokenValidityUrl=config.authorizationMicroserviceEncodeTokenUrl || conf.authorizationMicroservice.tokenValidityUrl;
    conf.authorizationMicroservice.access_token=config.authorizationMicroserviceToken || conf.authorizationMicroservice.access_token;
    conf.exampleUrl = config.exampleUrl || conf.exampleUrl;
    conf.tokenFieldName= config.tokenFieldName || conf.tokenFieldName;
    conf.secret= config.secret || conf.secret;
    conf.answerOnTheFly= _.isUndefined(config.answerOnTheFly) ? conf.answerOnTheFly : config.answerOnTheFly;
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


function decodeToken(token){

    try {
        var decoded = jwt.decode(token, conf.secret);

        if (decoded.exp <= Date.now()) {
            return ({
                valid:false,
                error_message:"The access_token is expired"
            });
        }else{
            decoded.valid=true;
            return(decoded);
        }
    } catch (err) {
        return ({
            valid:false,
            error_message:"The access_token is invalid or malformed"
        });
    }
};

exports.decodeToken = function(token){
    decodeToken(token);
};

exports.addRole=function(roles){
    var role,method;
    async.eachSeries(roles,function(value,callback){
        value.URI=value.URI.endsWith("/") ? value.URI : value.URI+"/";
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
        value.URI=value.URI.endsWith("/") ? value.URI : value.URI+"/";
        role=currentRoles[value.URI]||{POST:[],GET:[],PUT:[],DELETE:[]};
        method=value.method.toUpperCase();
        if (method=="DEL") method= "DELETE";
        role[method]=_.union(role[method],value.authToken);
        currentRoles[value.URI]=role;
        callback();
    });
};



exports.downgradeRole=function(roles){

    async.eachSeries(roles,function(value,callback){
        value.URI=value.URI.endsWith("/") ? value.URI : value.URI+"/";
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
    return(currentRoles);
};

exports.resetRoles=function(){
    currentRoles={};
};


/*
 <table><tbody>
 <tr><th align="left">Alessandro Romanino</th><td><a href="https://github.com/aromanino">GitHub/aromanino</a></td><td><a href="mailto:a.romanino@gmail.com">mailto:a.romanino@gmail.com</a></td></tr>
 <tr><th align="left">Guido Porruvecchio</th><td><a href="https://github.com/gporruvecchio">GitHub/porruvecchio</a></td><td><a href="mailto:guido.porruvecchio@gmail.com">mailto:guido.porruvecchio@gmail.com</a></td></tr>
 </tbody></table>
 * */