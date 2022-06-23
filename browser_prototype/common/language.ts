export interface IDisposable
{
    dispose(): void;
}

export function using<T extends IDisposable>(resource: T, func: (resource: T) => void)
{
    try
    {
        func(resource);
    } finally
    {
        resource.dispose();
    }
}

export interface IHashable
{
    hash(): string;
}

export class HashMap<K extends IHashable, V>
{
    private map = new Map<string, V>();
    constructor(init: [K, V][] = [])
    {
        let key, value;
        for ([key, value] of init)
        {
            this.put(key, value);
        }
    }

    has(key: K): boolean
    {
        return this.map.has(key.hash());
    }

    put(key: K, value: V): void
    {
        this.map.set(key.hash(), value);
    }

    get(key: K): V | undefined
    {
        return this.map.get(key.hash());
    }
}

export class HashSet<V extends IHashable>
{
    private map = new Map<string, V>();
    constructor(init: V[] = [])
    {
        for (let value of init)
        {
            this.put(value);
        }
    }

    put(value: V): void
    {
        this.map.set(value.hash(), value);
    }

    has(value: V): boolean
    {
        return this.map.get(value.hash()) != undefined;
    }

    as_list(): V[]
    {
        return Array.from(this.map.values());
    }
}

export interface IDeserializable<T>
{
    deserialize(payload: string): T;
}

export interface ISerializable
{
    serialize(): string;
}

export interface ICopyable<T>
{
    copy(): T;
}

export function extract<T>(array: T[], filter: (a: T) => a is T): T[]
{
    let extracted = array.filter(filter);
    let remaining = array.filter((a) => !filter(a));
    array.splice(0, array.length, ...remaining);
    return extracted;
}

export function max(n1: number, n2: number): number
{
    return n1 > n2 ? n1 : n2;
}

export function min(n1: number, n2: number): number
{
    return n1 < n2 ? n1 : n2;
}

export function randint(n: number)
{
    return Math.floor(Math.random() * n);
}