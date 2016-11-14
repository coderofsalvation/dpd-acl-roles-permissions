(function(Script) {

  var _run = Script.prototype.run;
				
	var jsacl = require('jsonschema-acl')

  var pick = function(xs,x){
		return String(x).split('.').reduce(function(acc, x) {
			if (acc == null) {
				return;
			}
			return acc[x];
		}, xs);
	}

  Script.prototype.run = function(ctx, domain, fn) {

    if ( ctx ) {
      ctx.acl = function(end,data,user,configKey){

				var error
				var operation
				var roles = user && user.roles ? user.roles : []
				var resourceName = this.req.url.split("/")[1]
				var resourceConfig = this.dpd[ resourceName ].getResource().config
				var aclConfig = this.dpd[ resourceName ].getResource().config
				var aclConfig = configKey && pick(resourceConfig,configKey) ? 
												pick(resourceConfig,configKey) :
											  aclConfig	

				switch( ctx.method ){
					case "GET":    operation = "read";   break;
					case "POST":   operation = "create"; break;
					case "PUT":    operation = "update";  break;
					case "DELETE": operation = "delete";  break;
				}

				// check root permissions 
				if( aclConfig.acl ){
					var v = jsacl.validate( data, {acl:aclConfig.acl}, operation, roles )
					if( v.errors.length != 0 ) end( v.errors[0].message, 401)
				}
			
				// hide collection properties
				var hideProperty = function(data,key,prop){
					if( data[key] && prop.acl != undefined){
						var v = jsacl.validate( data, {acl:prop.acl}, "read", roles )
						if( v.errors.length != 0 ) delete data[key]
					}
				}

				if( resourceConfig.properties ){
					for( var i in resourceConfig.properties ){
						var prop = resourceConfig.properties[i]
						if( Array.isArray(data) ){
							for( var j in data ) hideProperty(data[j],i,prop)
						}else hideProperty(data,i,prop)
					}
				}
      }
			ctx.acl = ctx.acl.bind(ctx)
    }
    _run.call(this, ctx, domain, fn);
  }
  
})(require('deployd/lib/script'));
