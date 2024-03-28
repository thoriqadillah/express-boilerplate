import { Request } from "express"

export interface Pager<T = any> {
    page: number,
    totalPage: number,
    count: number
    limit: number
    items: T[]
}

export interface Paginator {
    page: number
    limit: number
    offset: number
    search: string
    orderBy: {
        column: string,
        order: string
    }

    totalPage(count: number): number
    query: (query: string, defaults?: string) => string
}

export function paginate(req: Request): Paginator {
    const page = req.Query('page').toNumber(1)
    const limit = req.Query('limit').toNumber(25)
    const orderBy = req.Query('orderBy').toString('created_at,desc').split(',')

    return {
        limit, 
        page,
        offset: (page - 1) * limit,
        search: req.Query('search').toString(),
        orderBy: {
            column: orderBy[0],
            order: orderBy[1]
        },

        totalPage: count => {
            const total = Math.floor(count / limit)
            return total <= 0 ? 1 : total
        },
        query: (query: string, defaults?: string) => req.Query(query).toString(defaults)
    }
}