var monkeypatch = require('monkeypatch')
var Script
var Collection

// patch require()
monkeypatch( require('module').prototype,'require', function(original, modname ){
  if( modname == 'deployd/lib/script' ){
    if( Script ) return Script
    Script = function(){}
    Script.prototype.run = function(){ }
    return Script
  }
  if( modname == 'deployd/lib/resources/collection' ){
    if( Collection ) return Collection
    Collection = function(){}
    Collection.prototype.run = function(){ }
    return Collection
  }
  return original(modname)
})

// include our script
var Script = require('deployd/lib/script')
var Collection = require('deployd/lib/resources/collection')
eval( require('fs').readFileSync('./index.js').toString() )

// mock resourceConfig
fooConfig = {
  "type": "Collection",
  "properties":{
    "dbKey3": {
      "acl":{
        "read": ["admin"], 
        "create": ["admin"], 
        "update": ["admin"], 
        "delete": ["admin"]
      } 
    }
  }
}

// mock context
var ctx = {
  method: "GET",
  req: {
    url: "/foo"
  },
  dpd: {
    foo: {
      getResource : function(){ 
        return {config: fooConfig } 
      }
    }
  }
}
Script.prototype.run(ctx,{},false) // attach acl function to ctx

// mock data
var data = {
  dbKey1: "dbKey1Value",
  dbKey2: "dbKey2Value"
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
var users   = [false, {roles:["admin"]} ]

users.map( function(user){
  console.log("\n## Testing for user "+ (user.roles ? user.roles[0] : "none" )+"\n")
  methods.map( function(method){

    var operation
    if( method == "GET" )    operation = "read"
    if( method == "POST" )   operation = "create"
    if( method == "PUT" )    operation = "update"
    if( method == "DELETE" ) operation = "delete"
    ctx.method = method

    console.log("TEST "+method+": simply pass data")
    var clonedData = clone(data)
    ctx.acl( cancelShouldNotBeCalled, clonedData, user )
    if( !equal(clonedData,data) ) throw 'data was changed'

    if( !user ){

      console.log("TEST "+method+": do not pass data")
      var cancelCalled = false
      fooConfig.acl = {}
      fooConfig.acl[operation] = ["admin"]
      ctx.acl( function(){ cancelCalled = true }, data, user )
      if( !cancelCalled ) throw 'data shouldnt have been passed'
      delete fooConfig.acl

      console.log("TEST "+method+": don't allow passing 'dbKey3' data")
      var clonedData = clone(data)
      clonedData.dbKey3 = "admin only"
      ctx.acl( cancelShouldNotBeCalled, clonedData, user )
      if( clonedData.dbKey3 ) throw 'dbKey3 should have been removed'

      console.log("TEST "+method+": don't allow passing 'dbKey3' data in array")
      var clonedData = [clone(data)]
      clonedData.dbKey3 = "admin only"
      ctx.acl( cancelShouldNotBeCalled, clonedData, user )
      if( clonedData[0].dbKey3 ) throw 'dbKey3 should have been removed from element 0'

    }

  })
})
