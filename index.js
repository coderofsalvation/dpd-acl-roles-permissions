(function(Script, Collection) {

	var monkeypatch = require('monkeypatch')

  var pick = function(xs,x){
		return String(x).split('.').reduce(function(acc, x) {
			if (acc == null) {
				return;
			}
			return acc[x];
		}, xs);
	}

  var cancel = function(msg, code){
    code = code ? code : 401
    this.done(false, {message:msg, status:code, statusCode: code})
  }

	var hasRole = function(userroles,roles){
		var ok = false
		if( roles.indexOf("*") != -1 ) return true
		userroles.map( function(userrole){
			roles.map( function(role){
				if( userrole == role ) ok = true 
			})
		})
		return ok
	}

  var getResourceConfig = function(resourceName){
    try {
      var configFile = process.cwd() +'/resources/roles/config.json'
      aclConfig = require( configFile )
      aclConfig = aclConfig[resourceName] ? aclConfig[resourceName] : false
      return aclConfig
    }catch (e){
			console.log('configFile '+configFile+' not found..please read the dpd-acl-roles-permissions README.md')
		}
  }

  var getResourceNameFromUrl = function(url){
    return url.split("/")[1]
  }

  var acl = function(end,data,config){
    var error
    var operation
    var aclConfig 
    var user = this.session.user
		userroles = user && user.roles ? user.roles : []
    var resourceName = getResourceNameFromUrl(this.req.url)
    if( !this.dpd[ resourceName ] ) return
    var resourceConfig = this.dpd[ resourceName ].getResource().config
 
    // try central configuration from 'roles'-resource
		aclConfig = getResourceConfig(resourceName)
    if( !aclConfig || !aclConfig[this.method] ) return

		if( aclConfig[ this.method ] && !hasRole(userroles,aclConfig[ this.method ].split(",") ) )
			end( "no permission", 401)
 
    // hide collection properties
    var hideProperty = function(data,key,prop,method){
      if( data[key] && prop && prop[method] ){
        if( !hasRole(userroles, prop[method].split(",") ) ) delete data[key]
      }
    }
    if( resourceConfig.properties ){
      for( var i in resourceConfig.properties ){
				if( !aclConfig.properties ) continue
        var prop = aclConfig.properties[i]
				if( !prop ) continue		
        if( Array.isArray(data) ){
          for( var j in data ) hideProperty(data[j],i,prop,this.method)
        }else hideProperty(data,i,prop,this.method)
      }
    }
  }

	monkeypatch( Collection.prototype,'find',function(original,ctx,fn){
    var resourceName = getResourceNameFromUrl(ctx.req.url)
    var aclConfig = getResourceConfig(resourceName)
    if( aclConfig && aclConfig.properties && 
      aclConfig.properties.createdBy &&
      aclConfig.properties.createdBy.restrict ){
      if( ctx.session.user && ctx.session.user.id ){
        ctx.query = ctx.query ? ctx.query : {}
        ctx.query.createdBy = ctx.session.user.id
      }else return cancel.apply(ctx, ["unknown user / not logged in"])  
    }
		original(ctx,function(err,result){
			acl.apply( ctx, [cancel.bind(ctx), result ] )
			fn(err,result)
		})
	})

	monkeypatch( Collection.prototype, 'handle', function(original,ctx){
    if( ctx ) acl.apply( ctx, [cancel.bind(ctx), {} ] )
    original(ctx)
	})

	monkeypatch( Script.prototype,'run',function(original,ctx,domain,fn){
    if ( ctx ) ctx.acl = acl.bind(ctx, ctx)
    original(ctx,domain,fn)
	})
  
})(require('deployd/lib/script'), require('deployd/lib/resources/collection'));
