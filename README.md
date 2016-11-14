Easily configure roles/permissions regarding methods and (nested) keyvalue-pairs for deployd

![Build Status](https://travis-ci.org/coderofsalvation/dpd-acl-roles-permissions.svg?branch=master)

<img src="http://www.glasbergen.com/wp-content/gallery/security/security23.gif" width="300" style="width:300px"/>

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

* method-specific (different settings for POST/GET/PUT/DELETE method)
* resource-permissions and nested key-permissions
* wrapper for hide() and protect()
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
						"create": ["admin"],    <-- allow POST method for me.roles["admin"]
						"read":   ["*"],        <-- allow GET for everybody                       
						"update": ["admin"],    <-- allow PUT for me.roles["admin"]
						"delete": ["admin"]     <-- allow DELETE fro me.roles["admin"]
					}                                                                 
					"type": "string"
					...
				}
        ...
      }
    }
