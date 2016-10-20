# tokenmanager
This module deals with the management of JWT tokens used for the protection of own API.
It enables encoding and decoding of the token itself and the definition of rules that allow to determine if a token type is enabled or not
to access a given resource.
This package and in particular mode  **checkAuthorization** middleware can be used in two modes:

1.  Call an external service that manages tokens(for example in a microservice architecture)
2.  Locally


If used locally you must manage tokens and authorizations with encode, decode and addRole functions.

* [Installation](#installation)
 * [Using tokenAndAuthorizationManager](#using)
    * [function configure(config)](#configure)
    * [checkAuthorization middleware](#middleware)
    * [manage token](#manage)
        * [function encode(dictionaryToEncode,tokenTypeClass,validFor)](#encode)
        * [function decode(token)](#decode)
        * [URI and token roles](#role)
            * [function addRole(roles)](#addRole)
            * [function getRoles()](#getRoles)
            * [function resetRoles()](#resetRoles)


## <a name="installation"></a>Installation
To use **tokenAndAuthorizationManager** install it in your Express project by typing:

`npm install tokenAndAuthorizationManager`


## <a name="using"></a>Using tokenAndAuthorizationManager

### Include tokenAndAuthorizationManager

Just require it like a simple package:

```javascript
var tokenManager = require('tokenAndAuthorizationManager');
```

### Using tokenAndAuthorizationManager

tokenAndAuthorizationManager provides a function "configure" for setting customizable tokenAndAuthorizationManager params and
a "checkAuthorization" middleware function to manage token request.

Here the function and middleware documentation:

### <a name="configure"></a>`function configure(config)`
This function must be used to define and customize "tokenAndAuthorizationManager" params.

Like this:

```javascript
var router = require('express').Router();
var tokenManager = require('tokenAndAuthorizationManager');
tokenManager.configure( {
                         "decodedTokenFieldName":"UserToken",
                         "authorizationMicroserviceUrl":"localhost:3000",
                         "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
                         "exampleUrl":"http://miosito.it"
                         "tokenFieldName":"access_token",
                         "secret":"secretKey"
});

```
#### configure parameters
The configure argument should be a JSON dictionary containing any of the keys in this example:

```javascript
{
    "decodedTokenFieldName":"UserToken",
    "url":"localhost:3000",
    "authorizationMicroserviceToken":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
    "exampleUrl":"http://MyDomain.com",
    "tokenFieldName":"access_token",
    "secret":"secretKey"
}
```

##### decodedTokenFieldName (String)
This is the name of the field containing the decoded token that the middleware adds to the request req.
The middleware encodes and verifies the client token and, if valid and authorized, in the request(req) it is added a field called
decodedTokenFieldName, containing the decode result.


##### tokenFieldName (String)
This is the name of the field containing the request token that the middleware must read and encode.
By default the middleware expect that the name is "access_token"


##### secret (String)
If the middleware is used locally( not use an external service that manages tokens) this is the name of the
secret key used to encode/decode token in **encode** and **decode** function


##### url (String)
if the **checkAuthorization** middleware is used to call an external service that manages tokens(for example in a microservice architecture) it contains
the url of this external service
 ```http://example.com:3000/checkIfTokenIsAuth ```

##### authorizationMicroserviceToken (String)
if the middleware is used to call an external service that manages tokens(for example in a microservice architecture) it contains
the token to access this external service

##### exampleUrl (dictionary)
String containing the domain of your application used in middleware response message.


### <a name="middleware"></a>`middleware checkAuthorization`
This middleware must be used to decode, validate, e verify token authorization.
It read the request access_token field sent header or body or query params, encodes and verifies the client token and, if valid and authorized, in the request(req) it is added a field called
decodedTokenFieldName, containing the decode result. If token is not valid or authorized to access the resource the middleware send a response
401 Unauthorized.


Like this:

```javascript
var router = require('express').Router();
var tokenManager = require('tokenAndAuthorizationManager');
tokenManager.configure( {
                         "decodedTokenFieldName":"UserToken",
                         "url":"localhost:3000",
                         "access_token":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
                         "exampleUrl":"http://miosito.it"
});

router.get('/resource', tokenManager.checkAuthorization, function(req,res){

    // if you are in here the token is valid and uthorized

    console.log("Decoded TOKEN:" + req.UserToken); // print the decode results
  ...
});

```


### <a name="manage"></a>`Manage token and resource(Uri) roles`
As described above, the **checkAuthorization** middleware can be used in two modes, so if used locally you need to
manage tokens(encode/decode) and set API endpoints roles. You Can make this with this suite of functions:

*  [function encode(dictionaryToEncode,tokenTypeClass,validFor)](#encode)
*  [function decode(token)](#decode)
*  [function addRole(roles)](#addRole)
*  [function getRoles()](#getRoles)
*  [function resetRoles()](#resetRoles)


#### <a name="encode"></a>`function encode(dictionaryToEncode,tokenTypeClass,validFor)`
This function encodes in a token a given a dictionary *dictionaryToEncode* containing the information to encode. It accepts 3 parameters:
* **dictionaryToEncode** : Object containing the dictionary to encode in the tokens. for example:
 ```javascript
    {
      "userId":"80248",
      "Other" : "........."
    }
 ```

* **tokenTypeClass** : String containing the encoding token type, for example "admin" for user admin.
* **validFor** : Object containing information about token expires information. It has 2 keys called unit and value.
                Unit is the key of what time you want to add from current time for token life, and value the amount of unit you want to add.
                The unit possible values are:

| Unit Value    | Shorthand |
| :--------:    | :--------:|
| years         | y         |
| quarters      | Q         |
| months        | M         |
| weeks         | w         |
| days          | d         |
| hours         | h         |
| minutes       | m         |
| seconds       | s         |
| milliseconds  | ms        |


for example :

```javascript
  // this set token life to 7 days
  {
    unit:"days",
    value:7
  }
```
You can use this function to generate your token like in this example:

```javascript
var router = require('express').Router();
var tokenManager = require('tokenAndAuthorizationManager');
tokenManager.configure( {
                         "decodedTokenFieldName":"UserToken",
                         "secret":"MyKey",
                         "exampleUrl":"http://miosito.it"
});

// dictionary to encode in the token
var toTokenize={
        "userId":"80248",
        "Other" : "........."
};

// now create a *TokenTypeOne* that expire within 1 hous.
var mytoken=tokenManager.encode(toTokenize,"TokenTypeOne",{unit:"hours",value:1});

console.log(mytoken); // it prints a token as a string like this *32423JKH43534KJ5H435K3L6H56J6K7657H6J6K576N76JK57*


```


#### <a name="decode"></a>`function decode(token)`
This function decode the given token and return the information bundled in it. The token parameter is a token
generated with encode(....) function

You can use this function if need to unpack the information contained in the token like in this example:

 ```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenAndAuthorizationManager');
 tokenManager.configure( {
                          "decodedTokenFieldName":"UserToken",
                          "secret":"MyKey",
                          "exampleUrl":"http://miosito.it"
 });

 // dictionary to encode in the token
    var toTokenize={
            "userId":"80248",
            "Other" : "........."
    };

 // now create a *TokenTypeOne* that expire within 1 hous.
 var mytoken=tokenManager.encode(toTokenize,"TokenTypeOne",{unit:"hours",value:1});

 console.log(mytoken); // it prints a token as a string like this *32423JKH43534KJ5H435K3L6H56J6K7657H6J6K576N76JK57*

 // if you need information in the token then you can decode it.
 var decodedToken=tokenManager.decode(mytoken);

 console.log(decodedToken); // it prints the unpack token information: "userId":"80248", "Other" : "........."

 ```

#### <a name="addRole"></a>`function addRole(roles)`
This function must be used to set authorization between tokens and endpoints and add new roles used by  *checkAuthorization* middleware
to verify token authorization for particular resources.

The roles param is an array where each element is an object containing a single role. Single role object is defined as bellow:
```javascript

    // ******************************************************************************************************************
    //    defining a role where only  "admin, tokenTypeOne, TokenTypeTwo" tokens type are authorized to access the resource
    //    "/resource" called with method "GET"
    // ******************************************************************************************************************
    {
        "URI":"/resource",
        "method":"GET",
        "authToken":[admin, tokenTypeOne, TokenTypeTwo],
    }

```

where:
 ..* URI : A string containing the path of the resource on witch set the role
 ..* method : A string the method on which set the role used to call the resource on which set the role
 ..* authToken : An array of Strings containing the list of token types authorized to access the resource "URI" with
                 the method "method"


param roles then contain an array of role defined as above, for example:
```javascript

    // **********************************************************************************************************************************************
    //  defining a roles where:
    //       1. only  "admin, tokenTypeOne, TokenTypeTwo" tokens type are authorized to access the resource "/resource" called with method "GET"
    //       2. only  "admin" tokens type are authorized to access the resource "/resource" called with method "POST"
    // **********************************************************************************************************************************************
    var roles= [
                { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]},
                { "URI":"/resource", "method":"POST",  "authToken":[admin]}
    ];

```


Next an example of function addRole(roles) usage
 ```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenAndAuthorizationManager');
 tokenManager.configure( {
                          "decodedTokenFieldName":"UserToken",
                          "secret":"MyKey",
                          "exampleUrl":"http://miosito.it"
 });


 var roles= [
                 { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]},
                 { "URI":"/resource", "method":"POST",  "authToken":[admin]}
     ];
 tokenManager.addRole(roles);


 // dictionary to encode in the token
    var toTokenize={
            "userId":"80248",
            "Other" : "........."
    };

 // now create a *TokenTypeOne* that expire within 1 hous.
 var mytoken=tokenManager.encode(toTokenize,"TokenTypeOne",{unit:"hours",value:1});




 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

     // this is an endpoint authenticated accessible only with "admin, tokenTypeOne, TokenTypeTwo" tokens as
     // described in the role { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]}


  });

 router.post("/resource",tokenManager.checkAuthorization,function(req,res,next){

     // this is an API authenticated accessible only with "admin" tokens as described in the role
     // { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]}

  });



 router.delete("/resource",tokenManager.checkAuthorization,function(req,res,next){

        // This point is unreachable due tokenManager.checkAuthorization respond with Unauthorized 401 because
        // no role set for DELETE "/resource"

     });


// Unauthenticated endpoint
 router.put("/resource",function(req,res,next){

    // this is an endpoint not authenticated so is reachable with or without token. Also that
    // no role is set for PUT "/resource" an Unauthorized 401 response is not sent because
    // checkAuthorization is not used, so it is an unauthenticated endpoint

 });

 ```

 Attention that in addRole(roles) each role defined in "roles" **override** and not **append**. for example:
 ```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenAndAuthorizationManager');
 tokenManager.configure( {
                          "decodedTokenFieldName":"UserToken",
                          "secret":"MyKey",
                          "exampleUrl":"http://miosito.it"
 });


 var roles= [
                 { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]},
                 { "URI":"/resource", "method":"POST",  "authToken":[admin]}
     ];
 tokenManager.addRole(roles);

 tokenManager.addRole({ "URI":"/resource", "method":"POST",  "authToken":[newAdmin]});


 // dictionary to encode in the token
    var toTokenize={
            "userId":"80248",
            "Other" : "........."
    };

 // now create a *TokenTypeOne* that expire within 1 hous.
 var mytoken=tokenManager.encode(toTokenize,"TokenTypeOne",{unit:"hours",value:1});




 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

     // this is an endpoint authenticated accessible only with "admin, tokenTypeOne, TokenTypeTwo" tokens as
     // described in the role { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]}


  });

 router.post("/resource",tokenManager.checkAuthorization,function(req,res,next){

     // this is an API authenticated accessible only with "newAdmin" and not with "admin" tokens as described in the first role
     // { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]} because the second role
     // { "URI":"/resource", "method":"POST",  "authToken":[newAdmin]} override the first

  });


 // To update a role in append mode you must redefine the role concatenating the new with previous role

 var oldRoles=tokenManager.getRoles(); // grt roles list
 var newRole={ "URI":"/resource", "method":"POST",  "authToken":["admin","newAdmin"]}; // set new role
 if(oldRoles[newRole.URI]){ // if the role already exist
    newRole.authToken.concat(oldRoles[newRole.URI][newRole.method]); // append new to old role
                           //------------  ^    ------  ^ -------- //
                           //------------  |    ------  | -------- //
 }                         //--------  Resource ----  method ----- //
 tokenManager.addRole(newRole);

 ```

#### <a name="getRoles"></a>`function getRoles()`
This function must be used to get the list of set roles used by checkAuthorization middleware.

Next an example of function getRoles() usage
 ```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenAndAuthorizationManager');
 tokenManager.configure( {
                          "decodedTokenFieldName":"UserToken",
                          "secret":"MyKey",
                          "exampleUrl":"http://miosito.it"
 });


 var roles= [
                 { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]},
                 { "URI":"/resource", "method":"POST",  "authToken":[admin]}
     ];
 tokenManager.addRole(roles);


 var rolesList= tokenManager.getRoles();

 console.log(rolesList) // print this:
                        // { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]},
                        // { "URI":"/resource", "method":"POST",  "authToken":[admin]}

 ```



#### <a name="resetRoles"></a>`function resetRoles()`
This function must be used to reset authorization roles


Next an example of function resetRoles() usage
 ```javascript
 var router = require('express').Router();
 var tokenManager = require('tokenAndAuthorizationManager');
 tokenManager.configure( {
                          "decodedTokenFieldName":"UserToken",
                          "secret":"MyKey",
                          "exampleUrl":"http://miosito.it"
 });


 var roles= [
                 { "URI":"/resource", "method":"GET",  "authToken":[admin, tokenTypeOne, TokenTypeTwo]},
                 { "URI":"/actions/resetRoles", "method":"POST",  "authToken":[admin]}

     ];
 // set roles
 tokenManager.addRole(roles);

 //reset roles
 tokenManager.resetRoles();


 // dictionary to encode in the token
    var toTokenize={
            "userId":"80248",
            "Other" : "........."
    };

 // now create a *TokenTypeOne* that expire within 1 hous.
 var mytoken=tokenManager.encode(toTokenize,"TokenTypeOne",{unit:"hours",value:1});




 //create authenticated endpoints using middleware
 router.get("/resource",tokenManager.checkAuthorization,function(req,res,next){

     // This point is unreachable due tokenManager.checkAuthorization respond with Unauthorized 401 because
     // no role set for GET "/resource" due resetRoles() reset the role dictionary

  });

 ```


License - "MIT License"
-----------------------

MIT License

Copyright (c) 2016 aromanino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



#Contributors
------------
| Name and Surname                                                          |
| --------------------------------------------------------------------------|
| Alessandro Romanino ([a.romanino@gmail.com](mailto:a.romanino@gmail.com)) |
| Guido Porruvecchio ([guido.porruvecchio@gmail.com](mailto:guido.porruvecchio@gmail.com)) |

