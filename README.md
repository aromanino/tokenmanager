# tokenmanager
This module deals with the management of JWT tokens that are used for the protection of own API.
It enables encoding and decoding of the token itself and the definition of rules that allow to determine if a token type is enabled or not
to access a given resource.


* [Installation](#installation)
 * [Using tokenAndAuthorizationManager](#using)
   * [function configure(config)](#configure)
   * [checkAuthorization middleware](#middleware)


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
                         "url":"localhost:3000",
                         "access_token":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
                         "exampleUrl":"http://miosito.it"
});

```
#### configure parameters
The configure argument should be a JSON dictionary containing any of the keys in this example:

```javascript
{
    "decodedTokenFieldName":"UserToken",
    "url":"localhost:3000",
    "access_token":"4343243v3kjh3k4g3j4hk3g43hjk4g3jh41h34g3jhk4g",
    "exampleUrl":"http://miosito.it"
}
```

##### decodedTokenFieldName (String)
This is the name of the field containing the decoded token that the middleware adds to the request req.
The middleware encodes and verifies the client token and, if valid and authorized, in the request(req) it is added a field called
decodedTokenFieldName, containing the decode result.

##### url (String)
if the middleware is used to call an external service that manages tokens(for example in a microservice architecture) it contains
the url of this external service
 ```http://example.com:3000/checkIfTokenIsAuth ```

##### access_token (String)
if the middleware is used to call an external service that manages tokens(for example in a microservice architecture) it contains
the access_token to acess this external service

##### exampleUrl (dictionary)
String containing the domain of your application used in middleware response message.