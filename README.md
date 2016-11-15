Easily configure roles/permissions regarding methods and (nested) keyvalue-pairs for deployd

![Build Status](https://travis-ci.org/coderofsalvation/dpd-acl-roles-permissions.svg?branch=master)

<img src="http://i.giphy.com/81xwEHX23zhvy.gif" width="150" style="width:150px"/>

## Usage 

    $ npm install dpd-acl-roles-permissions dpd-event --save

## Centralized roles-configuration

* Run deployd and go to your dashboard 
* Add a collection-resource called '`/my-endpoint`' with fields `name`, `email`
* Add a roles-field in the properties-menu of the users-resource (array value: `["admin","staff","premium"]`)

<center><img src="doc/dpd-1.png"/></center>

* Now add an '`event`'-resource in the left menu (green button) with the name `/roles`

<center><img src="doc/dpd-2.png"/></center>

* In the config-item paste the json below

``````
{
  "my-endpoint": {
    "GET":    "*",
    "POST":   "admin,staff,premium",
    "PUT":    "admin,staff,premium",
    "DELETE": "admin,staff,premium",
    "properties": {
      "email": {
        "GET":  "admin,staff,premium",
        "POST": "admin,staff,premium",
        "PUT":  "admin,staff,premium"
      }
    } 
  }
}
```

* `curl -X GET http://localhost/my-endpoint` will work (but without 'email'-field for non-role users )
* `curl -X POST http://localhost/my-endpoint` will only work for user with admin- or staff- or premium-roles

## Automatic filter results by owner 

`dpd-acl-roles-permissions` has an integration for [dpd-collection-systemfields](https://npmjs.org/package/dpd-collection-systemfields).
It allows you to easily setup endpoints which return owned-only results:

* run `npm install dpd-collection-systemfields --save`
* add at least the 'createdBy'-fields to all your collection-endpoints (see [docs](https://npmjs.org/package/dpd-collection-systemfields) )

``````
{
  "my-endpoint": {
    "GET":    "*",
    "POST":   "admin,staff,premium",
    "PUT":    "admin,staff,premium",
    "DELETE": "admin,staff,premium",
    "properties": {
      "createdBy": {
        "restrict": true,               <--- add this to filter *any* mongodb query on current user 
        "GET":  "admin,staff,premium",
        "POST": "admin,staff,premium",
        "PUT":  "admin,staff,premium"
      }
    } 
  }
}
```

## Features 

* restrict methods (POST/GET/PUT/DELETE method)
* restrict (nested) key-permissions in incoming payloads (or outgoing results)
* no need to use hide() and protect() all over the place 
* works for all types of resource scripts
