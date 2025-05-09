/*
 node-jvm
 Copyright (c) 2013 Yaroslav Gaponov <yaroslav.gaponov@gmail.com>
*/

// var util = ("util");

import Numeric from "./util/numeric";
import Signature from "./classfile/signature";

import TAGS from "./classfile/tags";
import { ATTRIBUTE_TYPES } from "./classfile/attributetypes";
import { SCHEDULER, CLASSES } from "./global";

import { OPCODES } from './opcodes';
import { ClassArea } from "./classfile/classarea";




export class Frame {
  _cp: any[]
  _pid: number

  _code
  _exception_table
  _locals: any[]
  _stack: any[] = []
  _ip: number
  _widened: boolean
  constructor(readonly classArea: ClassArea, readonly method: any) {
    this._pid = 0; // default main thread
    this._cp = classArea.getConstantPool()!;


    for (var i = 0; i < method.attributes.length; i++) {
      if (method.attributes[i].info.type === ATTRIBUTE_TYPES.Code) {
        this._code = method.attributes[i].info.code;
        this._exception_table = method.attributes[i].info.exception_table;
        this._locals = new Array(method.attributes[i].info.max_locals);
        break;
      }
    }

  }

  setPid(pid) {
    this._pid = pid;
  }

  _read8() {
    return this._code[this._ip++];
  }


  _read16() {
    return this._read8() << 8 | this._read8();
  };

  _read32() {
    return this._read16() << 16 | this._read16();
  };

  _throw(ex) {
    var handler_pc = null;

    for (var i = 0; i < this._exception_table.length; i++) {
      if (this._ip >= this._exception_table[i].start_pc && this._ip <= this._exception_table[i].end_pc) {
        if (this._exception_table[i].catch_type === 0) {
          handler_pc = this._exception_table[i].handler_pc;
        } else {
          var name = this._cp[this._cp[this._exception_table[i].catch_type].name_index].bytes;
          if (name === ex.getClassName()) {
            handler_pc = this._exception_table[i].handler_pc;
            break;
          }
        }
      }
    }

    if (handler_pc != null) {
      this._stack.push(ex);
      this._ip = handler_pc;
    } else {
      throw ex;
    }
  }

  run(args: any[], done) {
    var self = this;

    this._ip = 0;
    this._stack = [];
    this._widened = false;

    this._locals[0] = args
    /*
    for (var i = 0; i < args.length; i++) {
      console.log({
        aa: this._locals[i],

        ll: args[i]
      })
      this._locals[i] = args[i];
    }*/



    // process.exit(1);

    var step = function () {

      SCHEDULER.tick(self._pid, function () {
        var opCode = self._read8()

        switch (opCode) {

          case OPCODES.return:
            return done();

          case OPCODES.ireturn:
          case OPCODES.lreturn:
          case OPCODES.freturn:
          case OPCODES.dreturn:
          case OPCODES.areturn:
            return done(self._stack.pop());

          default:
            var opName = OPCODES.toString(opCode);

            if (!(opName in self)) {
              throw new Error(`Opcode ${opName} [${opCode}] is not supported.`);
            }

            self[opName](function () { return step(); });
            break;
        }
      });

    };

    step();
  }


  nop(done) {
    return done();
  }

  aconst_null(done) {
    this._stack.push(null);
    return done();
  }

  iconst_m1(done) {
    this._stack.push(-1);
    return done();
  }

  iconst_0(done) {
    this._stack.push(0);
    return done();
  }

  lconst_0(done) {
    this._stack.push(0);
    return done();
  }

  fconst_0(done) {
    this._stack.push(0);
    return done();
  }

  dconst_0(done) {
    this._stack.push(0);
    return done();
  }

  iconst_1(done) {
    this._stack.push(1);
    return done();
  }

  lconst_1(done) {
    this._stack.push(1);
    return done();
  }

  fconst_1(done) {
    this._stack.push(1);
    return done();
  }

  dconst_1(done) {
    this._stack.push(1);
    return done();
  }

  iconst_2(done) {
    this._stack.push(2);
    return done();
  }

  fconst_2(done) {
    this._stack.push(2);
    return done();
  }

  iconst_3(done) {
    this._stack.push(3);
    return done();
  }

  iconst_4(done) {
    this._stack.push(4);
    return done();
  }

  // iconst_4(done) {
  //   this._stack.push(5);
  //   return done();
  // }

  iconst_5(done) {
    this._stack.push(5);
    return done();
  }

  sipush(done) {
    this._stack.push(this._read16());
  }

  bipush(done) {
    this._stack.push(this._read8());
    return done();
  }

  ldc(done) {
    var constant = this._cp[this._read8()];
    switch (constant.tag) {
      case TAGS.CONSTANT_String:
        this._stack.push(this._cp[constant.string_index].bytes);
        break;
      default:
        throw new Error("not support constant type");
    }
    return done();
  }

  ldc_w(done) {
    var constant = this._cp[this._read16()];
    switch (constant.tag) {
      case TAGS.CONSTANT_String:
        this._stack.push(this._cp[constant.string_index].bytes);
        break;
      default:
        throw new Error("not support constant type");
    }
    return done();
  }

  ldc2_w(done) {
    var constant = this._cp[this._read16()];
    switch (constant.tag) {
      case TAGS.CONSTANT_String:
        this._stack.push(this._cp[constant.string_index].bytes);
        break;
      case TAGS.CONSTANT_Long:
        this._stack.push(Numeric.getLong(constant.bytes));
        break;
      case TAGS.CONSTANT_Double:
        this._stack.push(constant.bytes.readDoubleBE(0));
        break;
      default:
        throw new Error("not support constant type");
    }
    return done();
  }

  iload(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._stack.push(this._locals[idx]);
    this._widened = false;
    return done();
  }

  lload(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._stack.push(this._locals[idx]);
    this._widened = false;
    return done();
  }

  fload(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._stack.push(this._locals[idx]);
    this._widened = false;
    return done();
  }

  dload(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._stack.push(this._locals[idx]);
    this._widened = false;
    return done();
  }

  aload(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._stack.push(this._locals[idx]);
    this._widened = false;
    return done();
  }

  iload_0(done) {
    this._stack.push(this._locals[0]);
    return done();
  }

  lload_0(done) {
    this._stack.push(this._locals[0]);
    return done();
  }

  // fload_0(done) {
  //   this._stack.push(this._locals[0]);
  //   return done();
  // }

  fload_0(done) {
    this._stack.push(this._locals[0]);
    return done();
  }

  dload_0(done) {
    this._stack.push(this._locals[0]);
    return done();
  }

  aload_0(done) {
    this._stack.push(this._locals[0]);

    return done();
  }

  iload_1(done) {
    this._stack.push(this._locals[1]);
    return done();
  }

  lload_1(done) {
    this._stack.push(this._locals[1]);
    return done();
  }

  // fload_1(done) {
  //   this._stack.push(this._locals[1]);
  //   return done();
  // }

  // fload_1(done) {
  //   this._stack.push(this._locals[1]);
  //   return done();
  // }

  dload_1(done) {
    this._stack.push(this._locals[1]);
    return done();
  }

  aload_1(done) {
    this._stack.push(this._locals[1]);
    return done();
  }

  iload_2(done) {
    this._stack.push(this._locals[2]);
    return done();
  }

  lload_2(done) {
    this._stack.push(this._locals[2]);
    return done();
  }

  // fload_2(done) {
  //   this._stack.push(this._locals[2]);
  //   return done();
  // }

  // fload_2(done) {
  //   this._stack.push(this._locals[2]);
  //   return done();
  // }

  dload_2(done) {
    this._stack.push(this._locals[2]);
    return done();
  }

  aload_2(done) {
    this._stack.push(this._locals[2]);
    return done();
  }

  iload_3(done) {
    this._stack.push(this._locals[3]);
    return done();
  }

  lload_3(done) {
    this._stack.push(this._locals[3]);
    return done();
  }

  // fload_3(done) {
  //   this._stack.push(this._locals[3]);
  //   return done();
  // }

  // fload_3(done) {
  //   this._stack.push(this._locals[3]);
  //   return done();
  // }

  dload_3(done) {
    this._stack.push(this._locals[3]);
    return done();
  }

  aload_3(done) {
    this._stack.push(this._locals[3]);
    return done();
  }

  iaload(done) {
    var idx = this._stack.pop();
    var refArray = this._stack.pop();

    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      this._stack.push(refArray[idx]);
    }

    return done();
  }

  laload(done) {
    var idx = this._stack.pop();
    var refArray = this._stack.pop();

    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      this._stack.push(refArray[idx]);
    }

    return done();
  }

  faload(done) {
    var idx = this._stack.pop();
    var refArray = this._stack.pop();

    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      this._stack.push(refArray[idx]);
    }

    return done();
  }


  daload(done) {
    var idx = this._stack.pop();
    var refArray = this._stack.pop();

    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      this._stack.push(refArray[idx]);
    }

    return done();
  }

  aaload(done) {
    var idx = this._stack.pop();
    var refArray = this._stack.pop();

    if (!(refArray instanceof Array)) {
      throw new Error("WRONG ARRAY TYPE ")
    }

    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      this._stack.push(refArray[idx]);
    }

    return done();
  }

  baload(done) {
    var idx = this._stack.pop();
    var refArray = this._stack.pop();

    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      this._stack.push(refArray[idx]);
    }

    return done();
  }

  caload(done) {
    var idx = this._stack.pop();
    var refArray = this._stack.pop();

    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      this._stack.push(refArray[idx]);
    }

    return done();
  }

  saload(done) {
    var idx = this._stack.pop();
    var refArray = this._stack.pop();

    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      this._stack.push(refArray[idx]);
    }

    return done();
  }

  istore(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._locals[idx] = this._stack.pop();
    this._widened = false;
    return done();
  }

  lstore(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._locals[idx] = this._stack.pop();
    this._widened = false;
    return done();
  }

  fstore(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._locals[idx] = this._stack.pop();
    this._widened = false;
    return done();
  }

  dstore(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._locals[idx] = this._stack.pop();
    this._widened = false;
    return done();
  }

  astore(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._locals[idx] = this._stack.pop();
    this._widened = false;
    return done();
  }

  istore_0(done) {
    this._locals[0] = this._stack.pop();
    return done();
  }

  lstore_0(done) {
    this._locals[0] = this._stack.pop();
    return done();
  }

  fstore_0(done) {
    this._locals[0] = this._stack.pop();
    return done();
  }

  dstore_0(done) {
    this._locals[0] = this._stack.pop();
    return done();
  }

  astore_0(done) {
    this._locals[0] = this._stack.pop();
    return done();
  }

  istore_1(done) {
    this._locals[1] = this._stack.pop();
    return done();
  }

  lstore_1(done) {
    this._locals[1] = this._stack.pop();
    return done();
  }

  fstore_1(done) {
    this._locals[1] = this._stack.pop();
    return done();
  }

  dstore_1(done) {
    this._locals[1] = this._stack.pop();
    return done();
  }

  astore_1(done) {
    this._locals[1] = this._stack.pop();
    return done();
  }


  istore_2(done) {
    this._locals[2] = this._stack.pop();
    return done();
  }

  lstore_2(done) {
    this._locals[2] = this._stack.pop();
    return done();
  }

  fstore_2(done) {
    this._locals[2] = this._stack.pop();
    return done();
  }

  dstore_2(done) {
    this._locals[2] = this._stack.pop();
    return done();
  }

  astore_2(done) {
    this._locals[2] = this._stack.pop();
    return done();
  }

  istore_3(done) {
    this._locals[3] = this._stack.pop();
    return done();
  }

  lstore_3(done) {
    this._locals[3] = this._stack.pop();
    return done();
  }

  fstore_3(done) {
    this._locals[3] = this._stack.pop();
    return done();
  }

  dstore_3(done) {
    this._locals[3] = this._stack.pop();
    return done();
  }

  astore_3(done) {
    this._locals[3] = this._stack.pop();
    return done();
  }

  iastore(done) {
    var val = this._stack.pop();
    var idx = this._stack.pop();
    var refArray = this._stack.pop();


    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      refArray[idx] = val;
    }

    return done();
  }

  lastore(done) {
    var val = this._stack.pop();
    var idx = this._stack.pop();
    var refArray = this._stack.pop();


    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      refArray[idx] = val;
    }

    return done();
  }

  fastore(done) {
    var val = this._stack.pop();
    var idx = this._stack.pop();
    var refArray = this._stack.pop();


    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      refArray[idx] = val;
    }

    return done();
  }

  dastore(done) {
    var val = this._stack.pop();
    var idx = this._stack.pop();
    var refArray = this._stack.pop();


    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      refArray[idx] = val;
    }

    return done();
  }

  aastore(done) {
    var val = this._stack.pop();
    var idx = this._stack.pop();
    var refArray = this._stack.pop();


    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      refArray[idx] = val;
    }

    return done();
  }

  bastore(done) {
    var val = this._stack.pop();
    var idx = this._stack.pop();
    var refArray = this._stack.pop();


    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      refArray[idx] = val;
    }

    return done();
  }

  castore(done) {
    var val = this._stack.pop();
    var idx = this._stack.pop();
    var refArray = this._stack.pop();


    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      refArray[idx] = val;
    }

    return done();
  }

  sastore(done) {
    var val = this._stack.pop();
    var idx = this._stack.pop();
    var refArray = this._stack.pop();


    var ex = null;

    if (!refArray) {
      ex = CLASSES.newException("java/lang/NullPointerException");
    } else if (idx < 0 || idx >= refArray.length) {
      ex = CLASSES.newException("java/lang/ArrayIndexOutOfBoundsException", idx);
    }

    if (ex) {
      this._throw(ex);
    } else {
      refArray[idx] = val;
    }

    return done();
  }

  pop(done) {
    this._stack.pop();
    return done();
  }

  pop2(done) {
    this._stack.pop();
    return done();
  }

  dup(done) {
    var val = this._stack.pop();
    this._stack.push(val);
    this._stack.push(val);
    return done();
  }

  dup_x1(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val1);
    this._stack.push(val2);
    this._stack.push(val1);
    return done();
  }

  dup_x2(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    var val3 = this._stack.pop();
    this._stack.push(val1);
    this._stack.push(val3);
    this._stack.push(val2);
    this._stack.push(val1);
    return done();
  }

  dup2(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2);
    this._stack.push(val1);
    this._stack.push(val2);
    this._stack.push(val1);
    return done();
  }

  dup2_x1(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    var val3 = this._stack.pop();
    this._stack.push(val2);
    this._stack.push(val1);
    this._stack.push(val3);
    this._stack.push(val2);
    this._stack.push(val1);
    return done();
  }

  dup2_x2(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    var val3 = this._stack.pop();
    var val4 = this._stack.pop();
    this._stack.push(val2);
    this._stack.push(val1);
    this._stack.push(val4);
    this._stack.push(val3);
    this._stack.push(val2);
    this._stack.push(val1);
    return done();
  }


  swap(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val1);
    this._stack.push(val2);
    return done();
  }


  iinc(done) {
    var idx = this._widened ? this._read16() : this._read8();
    var val = this._widened ? this._read16() : this._read8();
    this._locals[idx] += val
    this._widened = false;
    return done();
  }

  iadd(done) {
    this._stack.push(this._stack.pop() + this._stack.pop());
    return done();
  }

  ladd(done) {
    this._stack.push(this._stack.pop() + this._stack.pop());
    return done();
  }

  dadd(done) {
    this._stack.push(this._stack.pop() + this._stack.pop());
    return done();
  }

  fadd(done) {
    this._stack.push(this._stack.pop() + this._stack.pop());
    return done();
  }

  isub(done) {
    this._stack.push(- this._stack.pop() + this._stack.pop());
    return done();
  }

  lsub(done) {
    this._stack.push(- this._stack.pop() + this._stack.pop());
    return done();
  }

  dsub(done) {
    this._stack.push(- this._stack.pop() + this._stack.pop());
    return done();
  }

  fsub(done) {
    this._stack.push(- this._stack.pop() + this._stack.pop());
    return done();
  }

  imul(done) {
    this._stack.push(this._stack.pop() * this._stack.pop());
    return done();
  }

  lmul(done) {
    this._stack.push(this._stack.pop() * this._stack.pop());
    return done();
  }

  dmul(done) {
    this._stack.push(this._stack.pop() * this._stack.pop());
    return done();
  }

  fmul(done) {
    this._stack.push(this._stack.pop() * this._stack.pop());
    return done();
  }

  idiv(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    if (val1 === 0) {
      this._throw(CLASSES.newException("java/lang/ArithmeticException"));
    } else {
      this._stack.push(val2 / val1);
    }
    return done();
  }

  ldiv(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    if (val1 === 0) {
      this._throw(CLASSES.newException("java/lang/ArithmeticException"));
    } else {
      this._stack.push(val2 / val1);
    }
    return done();
  }

  ddiv(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 / val1);
    return done();
  }

  fdiv(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 / val1);
    return done();
  }

  irem(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 % val1);
    return done();
  }

  lrem(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 % val1);
    return done();
  }

  drem(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 % val1);
    return done();
  }

  frem(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 % val1);
    return done();
  }

  ineg(done) {
    this._stack.push(- this._stack.pop());
    return done();
  }

  lneg(done) {
    this._stack.push(- this._stack.pop());
    return done();
  }

  dneg(done) {
    this._stack.push(- this._stack.pop());
    return done();
  }

  fneg(done) {
    this._stack.push(- this._stack.pop());
    return done();
  }

  ishl(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 << val1);
    return done();
  }

  lshl(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 << val1);
    return done();
  }

  ishr(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 >> val1);
    return done();
  }

  lshr(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 >> val1);
    return done();
  }

  iushr(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 >>> val1);
    return done();
  }

  lushr(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    this._stack.push(val2 >>> val1);
    return done();
  }

  iand(done) {
    this._stack.push(this._stack.pop() & this._stack.pop());
    return done();
  }

  land(done) {
    this._stack.push(this._stack.pop() & this._stack.pop());
    return done();
  }

  ior(done) {
    this._stack.push(this._stack.pop() | this._stack.pop());
    return done();
  }

  lor(done) {
    this._stack.push(this._stack.pop() | this._stack.pop());
    return done();
  }

  ixor(done) {
    this._stack.push(this._stack.pop() ^ this._stack.pop());
    return done();
  }

  lxor(done) {
    this._stack.push(this._stack.pop() ^ this._stack.pop());
    return done();
  }

  lcmp(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    if (val2 > val1) {
      this._stack.push(1);
    } else if (val2 < val1) {
      this._stack.push(-1);
    } else {
      this._stack.push(0);
    }
    return done();
  }

  fcmpl(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    if (isNaN(val1) || isNaN(val2)) {
      this._stack.push(-1);
    } else if (val2 > val1) {
      this._stack.push(1);
    } else if (val2 < val1) {
      this._stack.push(-1);
    } else {
      this._stack.push(0);
    }
    return done;
  }

  fcmpg(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    if (isNaN(val1) || isNaN(val2)) {
      this._stack.push(1);
    } else if (val2 > val1) {
      this._stack.push(1);
    } else if (val2 < val1) {
      this._stack.push(-1);
    } else {
      this._stack.push(0);
    }
    return done;
  }

  dcmpl(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    if (isNaN(val1) || isNaN(val2)) {
      this._stack.push(-1);
    } else if (val2 > val1) {
      this._stack.push(1);
    } else if (val2 < val1) {
      this._stack.push(-1);
    } else {
      this._stack.push(0);
    }
    return done;
  }

  dcmpg(done) {
    var val1 = this._stack.pop();
    var val2 = this._stack.pop();
    if (isNaN(val1) || isNaN(val2)) {
      this._stack.push(1);
    } else if (val2 > val1) {
      this._stack.push(1);
    } else if (val2 < val1) {
      this._stack.push(-1);
    } else {
      this._stack.push(0);
    }
    return done;
  }


  newarray(done) {
    var type = this._read8();
    var size = this._stack.pop();
    if (size < 0) {
      this._throw(CLASSES.newException("java/lang/NegativeSizeException"));
    } else {
      this._stack.push(new Array(size));
    }
    return done();
  }


  anewarray(done) {
    var idx = this._read16();
    var className = this._cp[this._cp[idx].name_index].bytes;
    var size = this._stack.pop();
    if (size < 0) {
      this._throw(CLASSES.newException("java/lang/NegativeSizeException"));
    } else {
      this._stack.push(new Array(size));
    }
    return done();
  }

  multianewarray(done) {
    var idx = this._read16();
    var type = this._cp[this._cp[idx].name_index].bytes;
    var dimensions = this._read8();
    var lengths = new Array(dimensions);
    for (var i = 0; i < dimensions; i++) {
      lengths[i] = this._stack.pop();
    }
    const createMultiArray = function (lengths) {
      if (lengths.length === 0) {
        return null;
      }
      var length = lengths.shift();
      var array = new Array(length);
      for (var i = 0; i < length; i++) {
        array[i] = createMultiArray(lengths);
      }
      return array;
    };
    this._stack.push(createMultiArray(lengths));
    return done();
  }

  arraylength(done) {
    var ref = this._stack.pop();
    this._stack.push(ref.length);
    return done();
  }

  if_icmpeq(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    var ref1 = this._stack.pop();
    var ref2 = this._stack.pop();
    this._ip = ref1 === ref2 ? jmp : this._ip;
    return done();
  }

  if_icmpne(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    var ref1 = this._stack.pop();
    var ref2 = this._stack.pop();
    this._ip = ref1 !== ref2 ? jmp : this._ip;
    return done();
  }

  if_icmpgt(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    var ref1 = this._stack.pop();
    var ref2 = this._stack.pop();
    this._ip = ref1 < ref2 ? jmp : this._ip;
    return done();
  }

  if_icmple(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    this._ip = this._stack.pop() >= this._stack.pop() ? jmp : this._ip;
    return done();
  }

  if_icmplt(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    this._ip = this._stack.pop() > this._stack.pop() ? jmp : this._ip;
    return done();
  }

  if_icmpge(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    var ref1 = this._stack.pop();
    var ref2 = this._stack.pop();
    this._ip = ref1 <= ref2 ? jmp : this._ip;
    return done();
  }

  if_acmpeq(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    var ref1 = this._stack.pop();
    var ref2 = this._stack.pop();
    this._ip = ref1 === ref2 ? jmp : this._ip;
    return done();
  }

  if_acmpne(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    var ref1 = this._stack.pop();
    var ref2 = this._stack.pop();
    this._ip = ref1 !== ref2 ? jmp : this._ip;
    return done();
  }

  ifne(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    this._ip = this._stack.pop() !== 0 ? jmp : this._ip;
    return done();
  }

  ifeq(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    this._ip = this._stack.pop() === 0 ? jmp : this._ip;
    return done();
  }

  iflt(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    this._ip = this._stack.pop() < 0 ? jmp : this._ip;
    return done();
  }

  ifge(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    this._ip = this._stack.pop() >= 0 ? jmp : this._ip;
    return done();
  }

  ifgt(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    this._ip = this._stack.pop() > 0 ? jmp : this._ip;
    return done();
  }

  ifle(done) {
    var jmp = this._ip - 1 + Numeric.getInt(this._read16());
    this._ip = this._stack.pop() <= 0 ? jmp : this._ip;
    return done();
  }

  i2l(done) {
    return done();
  }

  i2f(done) {
    return done();
  }

  i2d(done) {
    return done();
  }

  i2b(done) {
    return done();
  }

  i2c(done) {
    return done();
  }

  i2s(done) {
    return done();
  }

  l2i(done) {
    return done();
  }

  l2d(done) {
    return done();
  }

  l2f(done) {
    return done();
  }

  d2i(done) {
    return done();
  }

  d2l(done) {
    return done();
  }

  d2f(done) {
    return done();
  }

  f2d(done) {
    return done();
  }

  f2i(done) {
    return done();
  }

  f2l(done) {
    return done();
  }

  goto(done) {
    this._ip += Numeric.getInt(this._read16()) - 1;
    return done();
  }

  goto_w(done) {
    this._ip += Numeric.getInt(this._read32()) - 1;
    return done();
  }

  ifnull(done) {
    var ref = this._stack.pop();
    if (!ref) {
      this._ip += Numeric.getInt(this._read16()) - 1;
    }
    return done();
  }

  ifnonnull(done) {
    var ref = this._stack.pop();
    if (!!ref) {
      this._ip += Numeric.getInt(this._read16()) - 1;
    }
    return done();
  }

  putfield(done) {
    var idx = this._read16();
    var fieldName = this._cp[this._cp[this._cp[idx].name_and_type_index].name_index].bytes;
    var val = this._stack.pop();
    var obj = this._stack.pop();
    if (!obj) {
      this._throw(CLASSES.newException("java/lang/NullPointerException"));
    } else {
      obj[fieldName] = val;
    }
    return done();
  }

  getfield(done) {
    var idx = this._read16();
    var fieldName = this._cp[this._cp[this._cp[idx].name_and_type_index].name_index].bytes;
    var obj = this._stack.pop();
    if (!obj) {
      this._throw(CLASSES.newException("java/lang/NullPointerException"));
    } else {
      this._stack.push(obj[fieldName]);
    }
    return done();
  }


  new(done) {
    var idx = this._read16();
    var className = this._cp[this._cp[idx].name_index].bytes;
    this._stack.push(CLASSES.newObject(className));
    return done();
  }

  getstatic(done) {
    var idx = this._read16();
    var className = this._cp[this._cp[this._cp[idx].class_index].name_index].bytes;
    var fieldName = this._cp[this._cp[this._cp[idx].name_and_type_index].name_index].bytes;
    this._stack.push(CLASSES.getStaticField(className, fieldName));
    return done();
  }

  putstatic(done) {
    var idx = this._read16();
    var className = this._cp[this._cp[this._cp[idx].class_index].name_index].bytes;
    var fieldName = this._cp[this._cp[this._cp[idx].name_and_type_index].name_index].bytes;
    CLASSES.setStaticField(className, fieldName, this._stack.pop());
    return done();
  }

  invokestatic(done) {
    var self = this;

    var idx = this._read16();

    var className = this._cp[this._cp[this._cp[idx].class_index].name_index].bytes;
    var methodName = this._cp[this._cp[this._cp[idx].name_and_type_index].name_index].bytes;
    var signature = Signature.parse(this._cp[this._cp[this._cp[idx].name_and_type_index].signature_index].bytes);

    var args: any[] = [];
    for (var i = 0; i < signature.IN.length; i++) {
      if (!signature.IN[i].isArray && ["long", "double"].indexOf(signature.IN[i].type) !== -1) {
        args.unshift("");
        args.unshift(this._stack.pop());
      } else {
        args.unshift(this._stack.pop());
      }
    }

    var method = CLASSES.getStaticMethod(className, methodName, signature);

    if (method instanceof Frame) {
      method.setPid(self._pid);
      method.run(args, function (res) {
        if (signature.OUT.length != 0) {
          self._stack.push(res);
        }
        return done();
      });
    } else {
      var res = method.apply(null, args);
      if (signature.OUT.length != 0) {
        self._stack.push(res);
      }
      return done();
    }
  }


  invokevirtual(done) {
    var self = this;

    var idx = this._read16();

    var className = this._cp[this._cp[this._cp[idx].class_index].name_index].bytes;
    var methodName = this._cp[this._cp[this._cp[idx].name_and_type_index].name_index].bytes;
    var signature = Signature.parse(this._cp[this._cp[this._cp[idx].name_and_type_index].signature_index].bytes);

    var args: any[] = [];
    for (var i = 0; i < signature.IN.length; i++) {
      if (!signature.IN[i].isArray && ["long", "double"].indexOf(signature.IN[i].type) !== -1) {
        args.unshift("");
        args.unshift(this._stack.pop());
      } else {
        args.unshift(this._stack.pop());
      }
    }


    var instance = this._stack.pop();
    var method = CLASSES.getMethod(className, methodName, signature);

    if (method instanceof Frame) {
      args.unshift(instance);
      method.setPid(self._pid);
      method.run(args, function (res) {
        if (signature.OUT.length != 0) {
          self._stack.push(res);
        }
        return done();
      });
    } else {
      var res = method.apply(instance, args);
      if (signature.OUT.length != 0) {
        self._stack.push(res);
      }
      return done();
    }
  }

  invokespecial(done) {
    var self = this;

    var idx = this._read16();

    var className = this._cp[this._cp[this._cp[idx].class_index].name_index].bytes;
    var methodName = this._cp[this._cp[this._cp[idx].name_and_type_index].name_index].bytes;
    var signature = Signature.parse(this._cp[this._cp[this._cp[idx].name_and_type_index].signature_index].bytes);

    var args: any[] = [];
    for (var i = 0; i < signature.IN.length; i++) {
      if (!signature.IN[i].isArray && ["long", "double"].indexOf(signature.IN[i].type) !== -1) {
        args.unshift("");
        args.unshift(this._stack.pop());
      } else {
        args.unshift(this._stack.pop());
      }
    }


    var instance = this._stack.pop();
    var ctor = CLASSES.getMethod(className, methodName, signature);

    if (ctor instanceof Frame) {
      args.unshift(instance);
      ctor.setPid(self._pid);
      ctor.run(args, function () {
        return done();
      });
    } else {
      ctor.apply(instance, args);
      return done();
    }

  }

  invokeinterface(done) {
    var self = this;

    var idx = this._read16();
    var argsNumber = this._read8();
    var zero = this._read8();

    var className = this._cp[this._cp[this._cp[idx].class_index].name_index].bytes;
    var methodName = this._cp[this._cp[this._cp[idx].name_and_type_index].name_index].bytes;
    var signature = Signature.parse(this._cp[this._cp[this._cp[idx].name_and_type_index].signature_index].bytes);

    var args: any[] = [];
    for (var i = 0; i < signature.IN.length; i++) {
      if (!signature.IN[i].isArray && ["long", "double"].indexOf(signature.IN[i].type) !== -1) {
        args.unshift("");
        args.unshift(this._stack.pop());
      } else {
        args.unshift(this._stack.pop());
      }
    }


    var instance = this._stack.pop();

    if (instance[methodName] instanceof Frame) {
      args.unshift(instance);
      instance[methodName].setPid(self._pid);
      instance[methodName].run(args, function (res) {
        if (signature.OUT.length != 0) {
          self._stack.push(res);
        }
        return done();
      });
    } else {
      var res = instance[methodName].apply(instance, args);
      if (signature.OUT.length != 0) {
        self._stack.push(res);
      }
      return done();
    }
  }

  jsr(done) {
    var jmp = this._read16();
    this._stack.push(this._ip);
    this._ip = jmp;
    return done();
  }

  jsr_w(done) {
    var jmp = this._read32();
    this._stack.push(this._ip);
    this._ip = jmp;
    return done();
  }

  ret(done) {
    var idx = this._widened ? this._read16() : this._read8();
    this._ip = this._locals[idx];
    this._widened = false;
    return done();
  }

  tableswitch(done) {

    var startip = this._ip;
    var jmp;

    while ((this._ip % 4) != 0) {
      this._ip++;
    }

    var def = this._read32();
    var low = this._read32();
    var high = this._read32();
    var val = this._stack.pop();

    if (val < low || val > high) {
      jmp = def;
    } else {
      this._ip += (val - low) << 2;
      jmp = this._read32();
    }

    this._ip = startip - 1 + Numeric.getInt(jmp);

    return done();
  }

  lookupswitch(done) {

    var startip = this._ip;

    while ((this._ip % 4) != 0) {
      this._ip++;
    }

    var jmp = this._read32();
    var size = this._read32();
    var val = this._stack.pop();

    lookup:
    for (var i = 0; i < size; i++) {
      var key = this._read32();
      var offset = this._read32();
      if (key === val) {
        jmp = offset;
      }
      if (key >= val) {
        break lookup;
      }
    }

    this._ip = startip - 1 + Numeric.getInt(jmp);

    return done();
  }

  instanceof(done) {
    var idx = this._read16();
    var className = this._cp[this._cp[idx].name_index].bytes;
    var obj = this._stack.pop();
    if (obj.getClassName() === className) {
      this._stack.push(true);
    } else {
      this._stack.push(false);
    }
    return done();
  }

  checkcast(done) {
    var idx = this._read16();
    var type = this._cp[this._cp[idx].name_index].bytes;
    return done();
  }


  athrow(done) {
    this._throw(this._stack.pop());
    return done();
  }

  wide(done) {
    this._widened = true;
    return done();
  }

  monitorenter(done) {
    var obj = this._stack.pop();
    if (!obj) {
      this._throw(CLASSES.newException("java/lang/NullPointerException"));
    } else if (obj.hasOwnProperty("$lock$")) {
      this._stack.push(obj);
      this._ip--;
      SCHEDULER.yield();
    } else {
      obj["$lock$"] = "locked";
    }
    return done();
  }

  monitorexit(done) {
    var obj = this._stack.pop();
    if (!obj) {
      this._throw(CLASSES.newException("java/lang/NullPointerException"));
    } else {
      delete obj["$lock$"];
      SCHEDULER.yield();
    }
    return done();
  }

}