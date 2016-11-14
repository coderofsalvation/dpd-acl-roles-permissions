Easily configure roles/permissions regarding methods and (nested) keyvalue-pairs for deployd

![Build Status](https://travis-ci.org/coderofsalvation/dpd-acl-roles-permissions.svg?branch=master)

<img src="http://i.giphy.com/81xwEHX23zhvy.gif" width="150" style="width:150px"/>

## Usage 

    $ npm install dpd-acl-roles-permissions --save

Now put acl-checks in your events-code ( '`resource/user/get.js`' e.g.):

```
    ctx.acl( cancel, @, me )		// cancel request if method is not allowed 
                                    // and/or apply hide() or protect() on (nested) fields
```

## Requirements

Put a '`roles`'-property into '`resource/user/config.js`':

		{
			"type": "UserCollection",    
			"properties": {              
				"roles": {                 
					"name": "roles",         
					"type": "array",         
					"typeLabel": "array",    
					"required": false,       
					"id": "roles",
					"order": 0               
				}
				....
			}
		}

## Features 

* restrict methods (POST/GET/PUT/DELETE method)
* restrict (nested) key-permissions in incoming payloads (or outgoing results)
* no need to use hide() and protect() anymore
* works for all types of resource scripts
  
## method permissions/roles 

Add `acl` config to your Resource (in `resource/foo/config.js` e.g.):

    {                                                                                                                
      "type": "Collection",                                                                                          
      "acl": {                                                                                                                                                                                        
        "create": ["admin"],    <-- allow POST method for me.roles["admin"]
        "read":   ["*"],        <-- allow GET for everybody                       
        "update": ["admin"],    <-- allow PUT for me.roles["admin"]
        "delete": ["admin"]     <-- allow DELETE fro me.roles["admin"]
       }                                                                 
      "properties":{
        ...
      }
    }

> NOTE: don't forget to add some roles to it using the dashboard

## (nested) keyvalue-pairs permissions/roles 

Add `acl` config to your Resource (in `resource/foo/config.js` e.g.): 

    {                                                                                                                
      "type": "Collection",                                                                                          
      "properties":{
				"myRestrictedField": {
					"acl": {                                                                                                                                                                                        
						"create": ["admin"],    <-- delete myRestrictedField for non-adminroles POST-methods
						"read":   ["*"],        <-- allow all fields for everybody's GET-methods                       
						"update": ["admin"],    <-- delete myRestrictedField for non-adminroles PUT-methods
						"delete": ["admin"]     <-- delete myRestrictedField for non-admin DELETE-method
					}                                                                 
					"type": "string"
					...
				}
        ...
      }
    }
