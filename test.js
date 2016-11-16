var monkeypatch = require('monkeypatch')
var Script
var Collection
var lastMongoQuery

// mock resourceConfig
fooConfig = {
  "foo":{
    "GET":"admin", 
    "POST":"admin,staff,premium", 
    "PUT":"admin,staff,premium", 
    "DELETE":"admin,staff,premium", 
    "properties":{
      "createdBy": {
        "restrict":true, 
        "GET": "admin", 
        "POST": "admin", 
        "PUT": "admin", 
        "DELETE": "admin"
      }, 
      "dbKey3": {
        "GET": "admin", 
        "POST": "admin", 
        "PUT": "admin", 
        "DELETE": "admin"
      }, 
      "roles":{
        type:"array"
      }
    }
  }
}

// patch require()
monkeypatch( require('module').prototype,'require', function(original, modname ){
  if( modname == 'deployd/lib/script' ){
    if( Script ) return Script
    Script = function(){}
    Script.prototype.run = function(){ }
    return Script
  }
  if( modname == "/mnt/data/home/sqz/projects/dpd-acl-roles-permissions/resources/roles/config.json" ){
    return JSON.parse( JSON.stringify(fooConfig))
  }
  if( modname == 'deployd/lib/resources/collection' ){
    if( Collection ) return Collection
    Collection = function(){}
    Collection.prototype.run = function(){ }
    Collection.prototype.find = function(ctx, fn){ 
      lastMongoQuery = ctx.query   
      fn(null, {fakeresult:0}) 
    }
    Collection.prototype.handle = function(){ }
    return Collection
  }
  return original(modname)
})

// include our script
var Script = require('deployd/lib/script')
var Collection = require('deployd/lib/resources/collection')
eval( require('fs').readFileSync('./index.js').toString() )

// mock context
var ctx = {
  done: function(){}, 
  method: "GET",
  query: {}, 
  req: {
    url: "/foo"
  },
  session: { user: false }, 
  dpd: {
    foo: {
      getResource : function(){ 
        return {config: fooConfig.foo } 
      }
    }
  }
}
Script.prototype.run(ctx,{},false) // attach acl function to ctx

// mock data
var data = {
  dbKey1: "dbKey1Value",
  dbKey2: "dbKey2Value", 
  roles: ["admin"]
}

// mock user 
var user = { roles: ["foo"] }

// mock cancel function
var cancelShouldNotBeCalled = function(){
  throw "cancel() should not have been called"
}

// clone function
var clone = function(s){
  return JSON.parse( JSON.stringify(s) )
}

// compare function
var equal = function(a,b){
  return JSON.stringify(a) == JSON.stringify(b)
}

/*
 * test
 */
var methods = ["GET", "POST", "DELETE", "PUT"]
var users   = [false, {id:'123123', username: 'foo', roles:["admin"]} ]

users.map( function(user){
  console.log("\n## Testing for user "+ (user.roles ? user.roles[0] : "none" )+"\n")
  methods.map( function(method){

    ctx.method = method
    ctx.session = { user: user }

    var isAdmin = user && fooConfig.foo[method].match(/admin/) != null
    console.log("TEST "+method+": "+(isAdmin ? "pass" : "block")+" data for user "+(user ? user.name : "none" ))
    var clonedData = clone(data)
    var cancelCalled = false
    ctx.done = function(){ cancelCalled=true }
    ctx.acl( clonedData )
    if( (isAdmin && cancelCalled ) || (!isAdmin && !cancelCalled) ) 
      throw 'cancel was called for wrong reasons'

    // mongodb tests  
    ctx.query.account = 1
    Collection.prototype.find( ctx, function(err, result){
      var expected = '{"$or":[{"roles":{"$exists":false}}, {"public":true}]}'
      //console.log(expected)
    }) 
     
    if( !user ){

      console.log("TEST "+method+": don't allow passing 'dbKey3' data")
      var clonedData = clone(data)
      clonedData.dbKey3 = "admin only"
      ctx.acl( clonedData )
      if( clonedData.dbKey3 ) throw 'dbKey3 should have been removed'

      console.log("TEST "+method+": don't allow passing 'dbKey3' data in array")
      var clonedData = [clone(data)]
      clonedData.dbKey3 = "admin only"
      ctx.acl( clonedData )
      if( clonedData[0].dbKey3 ) throw 'dbKey3 should have been removed from element 0'
    
    }

  })
})
