import moment from "moment";
import ms from "ms";

export function parseFlags(argv: string[]): Record<string, string> {
    const flags: Record<string, string> = {}
    
    argv.forEach(arg => {
        if (arg.startsWith('--')) {
            const [flag, value] = arg.split('='); // Split the argument by '=' to separate flag and value
            const flagName = flag.slice(2); // Remove the leading '--' from the flag name
            
            flags[flagName] = value || './.env'; // If no value is provided, set it to true
        }
    })

    return flags
}

export interface Parser {
    toString(defaults?: string): string
    toBoolean(defaults?: boolean): boolean
    toNumber(defaults?: number): number
    toDuration(defaults?: string): number
    toDate(defaults?: string): Date
    toUnion<T = ''>(defaults?: T): T
}

export function parse(value?: string): Parser {
    function toString(defaults?: string): string {
        if (value) return value
        if (!value && defaults) return defaults
        
        return ''
    }

    function toBoolean(defaults?: boolean): boolean {
        if (value) return value === 'true'
        if (!value && defaults) return defaults

        return false
    }

    function toNumber(defaults?: number): number {
        if (value) return Number(value)
        if (!value && defaults) return defaults

        return 0
    }

    function toDate(defaults?: string): Date {
        const toDate = (milisecond: string) => {
          return moment().add(ms(milisecond)).toDate()
        };
    
        if (value) return toDate(value);
        if (!value && defaults) return toDate(defaults);
    
        return new Date();
    }

    function toDuration(defaults?: string): number {
        if (value) return ms(value);
        if (!value && defaults) return ms(defaults);
    
        return 0
    }

    function toUnion<T = ''>(defaults?: T): T {
        if (value) return value as T
        if (!value && defaults) return defaults

        return '' as T
    }

    return {
        toString,
        toBoolean,
        toNumber,
        toDuration,
        toUnion,
        toDate
    }
}