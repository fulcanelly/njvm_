/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/

var util = require("util");

var out = module.exports = function() {
    if (this instanceof out) {        
    } else {
        return new out();
    }
};

out.getClassName = function() {
    return "java/io/PrintStream";
}

//TODO

out.prototype["print"] = function() {
    console.log({arguments})
};

out.prototype["println"] = function() {
    console.log({arguments})

};

out.prototype["format"] = function(fmt, args) {
    console.log({arguments})
}

