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
    var message = { message: msg, status: code, statusCode: code };
    if (code >= 300) {
      this.done(message);
    } else {
      this.done(false, message);
    }
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

  var getAclConfig = function(resourceName){
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
    var str = String(url).split("/")
    return str[1] ? str[1].replace(/\?.*/, "") : ""
  }

  var acl = function(ctx,data,config){
    if( ctx.session && (ctx.session.isRoot || ctx.session.internal) ) return
    var error
    var operation
    var aclConfig 
    var user = this.session && this.session.user ? this.session.user : false
    if( !user && ctx.req.user ) user = ctx.req.user
    user = user ? user : {}

    userroles = user && user.roles ? user.roles : []
    var resourceName = getResourceNameFromUrl(this.req.url)
    if( !resourceName || !this.dpd[ resourceName ] ) return
    var resourceConfig = this.dpd[ resourceName ].getResource().config
 
    // try central configuration from 'roles'-resource
    aclConfig = getAclConfig(resourceName)

    if( !aclConfig || !aclConfig[this.method] ) return

    if( aclConfig[ this.method ] && !hasRole(userroles,aclConfig[ this.method ].split(",") ) )
      cancel.apply( this, ["no permission / not loggedin (session expired)", 401])

    // hide collection properties
    var hideProperty = function(data,key,prop,method){
      if( data && data[key] && prop && prop[method] ){
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
    var resourceName = String( getResourceNameFromUrl(ctx.req.url) ).replace(/-/g, '')
    if( !resourceName ) return
    var resourceConfig = ctx.dpd[ resourceName ].getResource().config
    var aclConfig = getAclConfig(resourceName)
    if( ctx.query.roles ) delete ctx.query.roles // don't allow specifying roles in url *security*
    if( !ctx.session.isRoot && !ctx.session.internal && && aclConfig && aclConfig.properties && 
      aclConfig.properties.createdBy &&
      aclConfig.properties.createdBy.restrict ){
      if( ctx.session.user && ctx.session.user.id && ctx.query.account ){
        delete ctx.query.account
        ctx.query = ctx.query ? ctx.query : {}
        ctx.query.createdBy = ctx.session.user.id
        if( resourceConfig.properties.roles && ctx.session.user.roles ){
          // wrap into or statement
          ctx.session.user.roles.push( ctx.session.user.id )
          ctx.query["$or"] = [ {createdBy:ctx.query.createdBy}, {
            roles: {"$in": ctx.session.user.roles}
          }]
          delete ctx.query.createdBy
        }
      }else{
        if( resourceConfig.properties.roles ){
          ctx.query["$or"] = [{ roles: {"$exists": false} }, { public: true } ]
        }else{
          cancel.apply(ctx,  ["unknown user / not logged in"])
        }
      }
    }

    original(ctx,function(err,result){
      if( ctx ) acl.apply( ctx, [ctx,result] )
      fn(err,result)
    })
  })

  monkeypatch( Collection.prototype, 'handle', function(original,ctx){
    if( ctx ) acl.apply( ctx, [ ctx, {} ] )
    original(ctx)
  })

  monkeypatch( Script.prototype,'run',function(original,ctx,domain,fn){
    if( ctx ){
       ctx.acl = acl.bind(ctx,ctx)
       acl.apply( ctx, [ ctx, {} ] )
    }
    original(ctx,domain,fn)
  })
  
})(require('deployd/lib/script'), require('deployd/lib/resources/collection'));
