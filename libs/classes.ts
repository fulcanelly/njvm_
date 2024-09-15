/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/

// var util = require("util");
// var fs = require("fs");
// var path = require("path");

import { ClassArea } from "./classfile/classarea";
import {Frame} from "./frame";

import ACCESS_FLAGS from "./classfile/accessflags";
import { LOG, SCHEDULER } from "./global";
import Integer from "./java/lang/Integer";
import * as R from 'ramda'
import System from "./java/lang/System";
import { PrintStream } from "./java/io/PrintStream";
import { StringBuilder } from "./java/lang/StringBuilder";


export class Classes {

  paths: [string];
  classes: {};
  staticFields: {};

  constructor() {
    this.paths = ['.'];
    this.classes = {};
    this.staticFields = {};
  }

  clinit() {
    for (var className in this.classes) {
      // classArea = this.classes[className];
      var clinit = this.getStaticMethod(className, "<clinit>", "()V");
      if (clinit instanceof Frame) {
        SCHEDULER.sync(function () {
          LOG.debug("call " + className + ".<clinit> ...");
          clinit.run([], function () {
            LOG.debug("call " + className + ".<clinit> ... done");
          });
        });
      }
    }
  }


  loadClassBytes(bytes: ArrayBuffer) {
    const classArea = new ClassArea(bytes);
    this.classes[classArea.getClassName()] = classArea;
    return classArea;
  }


  loadJSFile = function (fileName) {
    LOG.debug("loading " + fileName + " ...");
    throw new Error("not impl")
    // var classArea = import(fileName);

    // this.classes[classArea.getClassName()] = classArea;
    // return classArea;
  }

  newException(className: string, message?: string, cause?: string) {
    var ex = this.newObject(className);
    ex["<init>"](message, cause);
    return ex;
  }

  newObject(className: string) {
    var ca = this.getClass(className);
    if (ca instanceof ClassArea) {

      const ctor = function () { };
      ctor.prototype = this.newObject(ca.getSuperClassName());
      var o = new ctor();

      o.getClassName = () => className

      var cp = ca.getConstantPool()!;

      ca.getFields()!.forEach(function (field) {
        var fieldName = cp[field.name_index].bytes;
        o[fieldName] = null;
      });

      ca.getMethods()!.forEach(function (method) {
        var methodName = cp[method.name_index].bytes;
        o[methodName] = new Frame(ca, method);
      });

      return o;
    } else {
      var o = new ca();
      o.getClassName = () => className
      return o;
    }
  }

  getMethod(className: string, methodName: string, signature: string) {
    var ca = this.getClass(className);
    if (ca instanceof ClassArea) {
      var methods = ca.getMethods()!;
      var cp = ca.getConstantPool()!;

      for (var i = 0; i < methods.length; i++)
        if (!ACCESS_FLAGS.isStatic(methods[i].access_flags))
          if (cp[methods[i].name_index].bytes === methodName)
            if (signature.toString() === cp[methods[i].signature_index].bytes)
              return new Frame(ca, methods[i]);
    } else {
      var o = new ca();
      if (methodName in o) {
        return o[methodName];
      }
    }
    return null;
  };

  getStaticMethod(className: string, methodName: string, signature: string) {
    var ca = this.getClass(className);
    if (ca instanceof ClassArea) {
      var methods = ca.getMethods()!;
      var cp = ca.getConstantPool()!;

      for (var i = 0; i < methods.length; i++)
        if (ACCESS_FLAGS.isStatic(methods[i].access_flags))
          if (cp[methods[i].name_index].bytes === methodName)
            if (signature.toString() === cp[methods[i].signature_index].bytes)
              return new Frame(ca, methods[i]);
    } else {
      if (methodName in ca) {
        return ca[methodName];
      }
    }
    return null;
  };



  getStaticField(className: string, fieldName: string) {
    return this.staticFields[className + '.' + fieldName];
  }

  setStaticField(className: string, fieldName: string, value: any) {
    this.staticFields[className + '.' + fieldName] = value;
  }

  static CLASS_MAPPING = {
    java: {
      io: {
        PrintStream
      },
      lang: {
        Integer,
        System,
        StringBuilder
      }
    }
  }

  getClass(className: string) {

    // console.log(className)
    var ca = this.classes[className];
    if (ca) {
      return ca;
    }

    const path = className.split("/")

    const klass = R.path(path, Classes.CLASS_MAPPING)
    if (klass) {
      this.classes[className] = klass
      return klass
    }
    console.log({
      path, klass
    })

    for (var i = 0; i < this.paths.length; i++) {
      const path = this.paths[i].split("/")
      const klass = R.path(path, Classes.CLASS_MAPPING)
      console.log({
        path, klass
      })
      if (!klass) {
        throw new Error("not implemented")

      }
      return klass
      // var fileName = util.format("%s/%s", this.paths[i], className);
      // if (fs.existsSync(fileName + ".js")) {
      //   return this.loadJSFile(fileName + ".js");
      // }
      // if (fs.existsSync(fileName + ".class")) {
      //   return this.loadClassFile(fileName + ".class");
      // }
    }
    throw new Error(`Implementation of the ${className} class is not found.`);
  }



  getEntryPoint(className: string, methodName: string): Frame {
    for (var name in this.classes) {
      var ca = this.classes[name];
      if (ca instanceof ClassArea) {
        if (!className || (className === ca.getClassName())) {
          if (ACCESS_FLAGS.isPublic(ca.getAccessFlags())) {
            var methods = ca.getMethods()!;
            var cp = ca.getConstantPool()!;

            for (var i = 0; i < methods.length; i++) {
              if
                (
                ACCESS_FLAGS.isPublic(methods[i].access_flags) &&
                ACCESS_FLAGS.isStatic(methods[i].access_flags) &&
                cp[methods[i].name_index].bytes === methodName
              ) {
                // console.log({
                //   ca, me: methods[i]
                // })
                return new Frame(ca, methods[i]);
              }
            }
          }
        }
      }
    }

    throw new Error("WH")
  }


}




// }

// Classes.prototype.addPath = function(path) {
//     if (this.paths.indexOf(path) === -1) {
//         this.paths.push(path);
//     }
// }





