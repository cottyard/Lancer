interface IDisposable
{
    dispose(): void;
}

function using<T extends IDisposable>(resource: T, func: (resource: T) => void)
{
    try
    {
        func(resource);
    } finally
    {
        resource.dispose();
    }
}

interface IHashable
{
    hash(): string;
}

class HashMap<K extends IHashable, V>
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

    put(key: K, value: V): void
    {
        this.map.set(key.hash(), value);
    }

    get(key: K): V | undefined
    {
        return this.map.get(key.hash());
    }
}

class HashSet<V extends IHashable>
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

interface IDeserializable<T>
{
    deserialize(payload: string): T;
}

interface ISerializable
{
    serialize(): string;
}

interface ICopyable<T>
{
    copy(): T;
}

function extract<T>(array: T[], filter: (a: T) => a is T): T[]
{
    let extracted = array.filter(filter);
    let remaining = array.filter((a) => !filter(a));
    array.splice(0, array.length, ...remaining);
    return extracted;
}

function max(n1: number, n2: number): number
{
    return n1 > n2 ? n1 : n2;
}

function min(n1: number, n2: number): number
{
    return n1 < n2 ? n1 : n2;
}