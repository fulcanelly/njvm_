
export const ATTRIBUTE_TYPES: { [k in string]: keyof typeof ATTRIBUTE_TYPES } = {
    ConstantValue: "ConstantValue",
    Code: "Code",
    Exceptions: "Exceptions",
    InnerClasses: "InnerClasses",
    Synthetic: "Synthetic",
    SourceFile: "SourceFile",
    LineNumberTable: "LineNumberTable",
    LocalVariableTable: "LocalVariableTable",
    Deprecated: "Deprecated"
};