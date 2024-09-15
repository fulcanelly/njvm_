/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/

// import util from ("util"),
// import Reader from "..reader.js"

import TAGS from "./tags.js"

import ACCESS_FLAGS from "./accessflags.js"

import { ATTRIBUTE_TYPES } from "./attributetypes.js"

// import { Buffer } from 'buffer/'
import { Reader } from "../util/reader.js"

export class ClassArea {

  classImage

  constructor(classBytes) {
    this.classImage = getClassImage(classBytes);
  }

  getClassName() {
    return this.classImage.constant_pool[this.classImage.constant_pool[this.classImage.this_class].name_index].bytes;
  }

  getSuperClassName() {
    return this.classImage.constant_pool[this.classImage.constant_pool[this.classImage.super_class].name_index].bytes;
  }

  getAccessFlags() {
    return this.classImage.access_flags;
  }

  getConstantPool() {
    return this.classImage.constant_pool;
  }


  getFields() {
    return this.classImage.fields;
  }

  getMethods() {
    return this.classImage.methods;
  }

  getClasses() {
    const self = this;
    var classes: any[] = [];
    this.classImage.attributes.forEach(function (a) {
      if (a.info.type === ATTRIBUTE_TYPES.InnerClasses) {
        a.info.classes.forEach(function (c) {
          classes.push(self.classImage.constant_pool[self.classImage.constant_pool[c.inner_class_info_index].name_index].bytes);
          classes.push(self.classImage.constant_pool[self.classImage.constant_pool[c.outer_class_info_index].name_index].bytes);
        });
      }
    });
    return classes;
  }
}




type classImage = {
  magic?: string
  version?: {
    minor_version: number,
    major_version: number
  },
  constant_pool?: any[],
  access_flags?: number,
  fields?: FieldInfo[],
  interfaces?: any[]
  this_class?: number,
  super_class?: number,
  methods?: MethodInfo[],
  attributes?: ClassAtr[]
}

type ClassAtr = {
  attribute_name_index: any;
  attribute_length: any;
  info: {
    attribute_name_index: any;
  };
}

type FieldInfoAtr = {
  attribute_name_index: any;
  attribute_length: any;
  constantvalue_index: any;
}

type FieldInfo = {
  access_flags: any;
  name_index: any;
  descriptor_index: any;
  attributes_count: any;
  attributes: FieldInfoAtr[];
}


type MethodInfoAtr = {
  attribute_name_index: any;
  attribute_length: any;
  info: {
    attribute_name_index: any;
  };
}
type MethodInfo = {
  access_flags: any;
  name_index: any;
  signature_index: any;
  attributes_count: any;
  attributes: MethodInfoAtr[];
}


type EsceptionTable = {
  start_pc: number
  end_pc: number
  handler_pc: number
  catch_type
}

type CodeAttr = {
  attribute_name_index: number
  attribute_length: number
  info
}

declare type X = {}

type InnerClassAtr = {
  inner_class_info_index?: number
  outer_class_info_index?: number
  inner_name_index?: number
  inner_class_access_flags?: number
}

type GenericAttr = {
  attribute_name_index: number
  type?: keyof typeof ATTRIBUTE_TYPES
  constantvalue_index?: number
  sourcefile_index?: number

  max_stack?: number,
  max_locals?: number,


  code?: any


  exception_index_table?: number[]

  attributes?: CodeAttr[]
  exception_table?: EsceptionTable[]

  classes?: InnerClassAtr[]
}

var getClassImage = function (classBytes) {

  var classImage: classImage = {};

  var getAttribues = function (attribute_name_index, bytes) {

    const reader = Reader.create(bytes);
    const attribute: GenericAttr = { attribute_name_index: attribute_name_index };


    var item = classImage.constant_pool![attribute_name_index];


    switch (item.tag) {

      case TAGS.CONSTANT_Long:
      case TAGS.CONSTANT_Float:
      case TAGS.CONSTANT_Double:
      case TAGS.CONSTANT_Integer:
      case TAGS.CONSTANT_String:
        attribute.type = ATTRIBUTE_TYPES.ConstantValue;
        attribute.constantvalue_index = reader.read16();
        return attribute;


      case TAGS.CONSTANT_Utf8:

        switch (item.bytes) {

          case ATTRIBUTE_TYPES.Code:
            attribute.type = ATTRIBUTE_TYPES.Code;
            attribute.max_stack = reader.read16();
            attribute.max_locals = reader.read16();
            var code_length = reader.read32();
            attribute.code = reader.readBytes(code_length);

            var exception_table_length = reader.read16();
            attribute.exception_table = [];
            for (var i = 0; i < exception_table_length; i++) {
              var start_pc = reader.read16();
              var end_pc = reader.read16();
              var handler_pc = reader.read16();
              var catch_type = reader.read16();
              attribute.exception_table.push({
                start_pc: start_pc,
                end_pc: end_pc,
                handler_pc: handler_pc,
                catch_type: catch_type
              });
            }

            var attributes_count = reader.read16();
            attribute.attributes = [];
            for (var i = 0; i < attributes_count; i++) {
              const attribute_name_index = reader.read16();
              const attribute_length = reader.read32();
              const info = reader.readBytes(attribute_length);
              attribute.attributes.push({
                attribute_name_index: attribute_name_index,
                attribute_length: attribute_length,
                info: info
              });
            }
            return attribute;

          case ATTRIBUTE_TYPES.SourceFile:
            attribute.type = ATTRIBUTE_TYPES.SourceFile;
            attribute.sourcefile_index = reader.read16();
            return attribute;

          case ATTRIBUTE_TYPES.Exceptions:
            attribute.type = ATTRIBUTE_TYPES.Exceptions;
            var number_of_exceptions = reader.read16();
            attribute.exception_index_table = [];
            for (var i = 0; i < number_of_exceptions; i++) {
              attribute.exception_index_table.push(reader.read16());
            }
            return attribute;

          case ATTRIBUTE_TYPES.InnerClasses:
            attribute.type = ATTRIBUTE_TYPES.InnerClasses;
            var number_of_classes = reader.read16();
            attribute.classes = [];
            for (var i = 0; i < number_of_classes; i++) {
              const inner: InnerClassAtr = {};
              inner.inner_class_info_index = reader.read16();
              inner.outer_class_info_index = reader.read16();
              inner.inner_name_index = reader.read16();
              inner.inner_class_access_flags = reader.read16();
              attribute.classes.push(inner);
            }
            return attribute;

          default:
            throw new Error("This attribute type is not supported yet. [" + JSON.stringify(item) + "]");
        }

      default:
        throw new Error("This attribute type is not supported yet. [" + JSON.stringify(item) + "]");
    }
  };


  var reader = Reader.create(classBytes);
  classImage.magic = reader.read32().toString(16);

  classImage.version = {
    minor_version: reader.read16(),
    major_version: reader.read16()
  };

  classImage.constant_pool = [null];
  var constant_pool_count = reader.read16();
  for (var i = 1; i < constant_pool_count; i++) {
    var tag = reader.read8();
    switch (tag) {
      case TAGS.CONSTANT_Class:
        var name_index = reader.read16();
        classImage.constant_pool.push({ tag: tag, name_index: name_index });
        break;
      case TAGS.CONSTANT_Utf8:
        {
          var length = reader.read16();
          const bytes = reader.readString(length);
          classImage.constant_pool.push({ tag: tag, bytes: bytes });
        }
        break;
      case TAGS.CONSTANT_Methodref:
        var class_index = reader.read16();
        var name_and_type_index = reader.read16();
        classImage.constant_pool.push({ tag: tag, class_index: class_index, name_and_type_index: name_and_type_index });
        break;
      case TAGS.CONSTANT_NameAndType:
        var name_index = reader.read16();
        var signature_index = reader.read16();
        classImage.constant_pool.push({ tag: tag, name_index: name_index, signature_index: signature_index });
        break;
      case TAGS.CONSTANT_Fieldref:
        var class_index = reader.read16();
        var name_and_type_index = reader.read16();
        classImage.constant_pool.push({ tag: tag, class_index: class_index, name_and_type_index: name_and_type_index });
        break;
      case TAGS.CONSTANT_String:
        var string_index = reader.read16();
        classImage.constant_pool.push({ tag: tag, string_index: string_index });
        break;
      case TAGS.CONSTANT_Integer:
        {
          const bytes = reader.read32();
          classImage.constant_pool.push({ tag: tag, bytes: bytes });
        }
        break;
      case TAGS.CONSTANT_Double:
      case TAGS.CONSTANT_Long:
        const bytes = new Buffer(8);
        for (var b = 0; b < 8; b++) {
          bytes[b] = reader.read8();
        }
        classImage.constant_pool.push({ tag: tag, bytes: bytes });
        classImage.constant_pool.push(null); i++;
        break;
      case TAGS.CONSTANT_Fieldref:
      case TAGS.CONSTANT_Methodref:
      case TAGS.CONSTANT_InterfaceMethodref:
        var class_index = reader.read16();
        var name_and_type_index = reader.read16();
        classImage.constant_pool.push({ tag: tag, class_index: class_index, name_and_type_index: name_and_type_index });
        break;
      default:
        throw new Error(`tag ${tag} is not supported.`);
    }
  }

  classImage.access_flags = reader.read16();

  classImage.this_class = reader.read16();

  classImage.super_class = reader.read16();


  classImage.interfaces = [];
  var interfaces_count = reader.read16();
  for (var i = 0; i < interfaces_count; i++) {
    var index = reader.read16();
    if (index != 0) {
      classImage.interfaces.push(index);
    }
  }

  classImage.fields = [];
  var fields_count = reader.read16();
  for (var i = 0; i < fields_count; i++) {
    var access_flags = reader.read16();
    var name_index = reader.read16();
    var descriptor_index = reader.read16();
    var attributes_count = reader.read16();
    var field_info: FieldInfo = {
      access_flags: access_flags,
      name_index: name_index,
      descriptor_index: descriptor_index,
      attributes_count: attributes_count,
      attributes: []
    }
    for (var j = 0; j < attributes_count; j++) {
      var attribute_name_index = reader.read16();
      var attribute_length = reader.read32();
      var constantvalue_index = reader.read16();
      const attribute = {
        attribute_name_index: attribute_name_index,
        attribute_length: attribute_length,
        constantvalue_index: constantvalue_index
      }
      field_info.attributes.push(attribute);
    }
    classImage.fields.push(field_info);
  }


  classImage.methods = [];
  var methods_count = reader.read16();
  for (var i = 0; i < methods_count; i++) {
    var access_flags = reader.read16();
    var name_index = reader.read16();
    var signature_index = reader.read16();
    var attributes_count = reader.read16();
    var method_info: MethodInfo = {
      access_flags: access_flags,
      name_index: name_index,
      signature_index: signature_index,
      attributes_count: attributes_count,
      attributes: []
    }
    for (var j = 0; j < attributes_count; j++) {
      var attribute_name_index = reader.read16();
      var attribute_length = reader.read32();
      var info = getAttribues(attribute_name_index, reader.readBytes(attribute_length));
      const attribute = {
        attribute_name_index: attribute_name_index,
        attribute_length: attribute_length,
        info: info
      }
      method_info.attributes.push(attribute);
    }

    classImage.methods.push(method_info);
  }


  classImage.attributes = [];
  var attributes_count = reader.read16();
  for (var i = 0; i < attributes_count; i++) {
    var attribute_name_index = reader.read16();
    var attribute_length = reader.read32();
    var info = getAttribues(attribute_name_index, reader.readBytes(attribute_length));
    var attribute = {
      attribute_name_index: attribute_name_index,
      attribute_length: attribute_length,
      info: info
    }
    classImage.attributes.push(attribute);
  }

  return classImage;

};

