import color from 'colors'
import moment from "moment"

const now = () => moment().format('HH:mm:ss')
function warning(message?: any, ...params: any[]) {
    console.log(`[${color.yellow('WARNING')}] [${now()}]`, color.yellow(message), ...params) 
}

function log(message?: any, ...params: any[]) {
    console.log(`[${color.green('LOG')}] [${now()}]`, color.green(message), ...params) 
}

function info(message?: any, ...params: any[]) {
    console.log(`[${color.blue('INFO')}] [${now()}]`, color.green(message), ...params) 
}

function error(message?: any, ...params: any[]) {
    console.log(`[${color.red('ERROR')}] [${now()}]`, color.red(message), ...params) 
}

function debug(message?: any, ...params: any[]) {
    console.log(`['DEBUG'] [${now()}]`, message, ...params) 
}

export const Log = {
    info,
    warning,
    log,
    error,
    debug
}