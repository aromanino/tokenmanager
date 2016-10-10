var express = require('express');
var conf=require('./config').conf;
var request = require('request');
var _=require("underscore");


exports.checkAuthorization =  function(req, res, next) {


    console.log("decodeToken");

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
        var path=(req.route.path=="/") ? "" : req.route.path;
        if(_.isEmpty(req.baseUrl))
            URI=req.path+path;
        else
            URI=req.baseUrl+path;


        var rqparams={
            url:conf.authoritationMicroservice.url+'/tokenactions/checkiftokenisauth',
            headers : {'Authorization' : "Bearer "+ conf.authoritationMicroservice.access_token, 'content-type': 'application/json'},
            body:JSON.stringify({decode_token:token,URI:URI,method:req.method})
        };

        console.log("richiesta:" + JSON.stringify(rqparams));

        var decoded=null;

        request.post(rqparams, function(error, response, body){

            console.log("Body In DEcode:"+body);
            if(error) {
                console.log("ERROR:"+error);
                return  res.status(500).send({error:'internal_microservice_error', error_message:error+" "});
            }else{

                decoded = JSON.parse(body);

                if(_.isUndefined(decoded.valid)){
                    return  res.status(response.statusCode).send({error:decoded.error, error_message : decoded.error_message});
                }else{
                    if(decoded.valid==true){
                        req[conf.decodedTokenFieldName]=decoded.token;
                        next();
                    }else{
                        return  res.status(401).send({error:'Unauthorized', error_message : decoded.error_message});
                    }
                }
            }
        });

    } else {
        return res.status(400)
            .set({'WWW-Authenticate':'Bearer realm='+exampleUrl+', error="invalid_request", error_message="The access token is required"'})
            .send({error:"invalid_request",error_message:"Unauthorized: Access token required, you are not allowed to use the resource"});
    }

};

exports.configure =  function(config) {
    conf.authoritationMicroservice.decodedTokenFieldName= config.decodedTokenFieldName || conf.authoritationMicroservice.decodedTokenFieldName;
    conf.authoritationMicroservice.url=config.authoritationMicroserviceUrl || conf.authoritationMicroservice.url;
    conf.authoritationMicroservice.access_token=config.access_token || conf.authoritationMicroservice.access_token;
    conf.exampleUrl = config.exampleUrl || conf.exampleUrl;
};

exports.encodeToken = function(req,res,next){



};

exports.decodeToken = function(req,res,next){



};