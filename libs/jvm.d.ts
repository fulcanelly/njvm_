export declare class JVM {
    loadClassBytes(bytes: Buffer): void
    
    on(event: 'exit', cb: (_code: any) => void): void

    run(args: string[]): void

}
