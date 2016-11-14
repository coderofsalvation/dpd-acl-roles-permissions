Easily configure roles/permissions regarding methods and (nested) keyvalue-pairs for deployd

![Build Status](https://travis-ci.org/coderofsalvation/dpd-acl-roles-permissions.svg?branch=master)

<img src="http://i.giphy.com/81xwEHX23zhvy.gif" width="150" style="width:150px"/>

## Usage 

    $ npm install dpd-acl-roles-permissions dpd-event --save

## Method #1: manual roles-configuration

* Run deployd and go to your dashboard 
* Add a collection-resource called '`/foo`' with fields `name`, `email`
* Add a roles-field in the properties-menu of the users-resource (with array-type: `["admin","user"]`)

You can put acl-checks in your events-code ( '`resource/foo/get.js`' e.g.):

```
    ctx.acl( cancel, @, me, {  
      read: ["admin"]               // cancel request if user does not have admin role 
      properties:{
        email:{                     // hide email when user does not have admin role
        acl: { read: ["admin"] }
      }
    })  
```

* `curl -X GET http://localhost/foo` will work (but without email for non-admin user  )
* `curl -X POST http://localhost/foo` will only work for admin-user

## Method #2: centralized roles-configuration

* Run deployd and go to your dashboard 
* Add a collection-resource called '`/foo`' with fields `name`, `email`
* Add a roles-field in the properties-menu of the users-resource (with array-type: `["admin","user"]`)
* Now add an '`event`'-resource with the name `/roles`
* In the config-item paste the json below

```
{
  "resources": {
    "foo": {
      "acl": {
        "create": [ "admin", "user" ],
        "read": [ "*" ],
        "update": [ "admin" ],
        "delete": [ "admin" ]
      }, 
      "properties": {
        "email": {
          "acl":{ "read": [ "admin" ] }
        }
      }
    }
  }
}
```
> NOTE: instead of combining all roles into one json, you can also put the resource-specific acl-code into `resources/foo/config.json`.

*Final step*: put checks in your code

You can put acl-checks in your events-code ( '`resource/foo/get.js`' e.g.):

```
    ctx.acl( cancel, @, me )    // cancel request if method is not allowed 
                                // and/or apply hide() or protect() on (nested) fields
```

* `curl -X GET http://localhost/foo` will work (but without email for non-admin user  )
* `curl -X POST http://localhost/foo` will only work for admin-user

## Features 

* restrict methods (POST/GET/PUT/DELETE method)
* restrict (nested) key-permissions in incoming payloads (or outgoing results)
* no need to use hide() and protect() anymore
* works for all types of resource scripts
