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

function beep(): void
{
    let v = g.audio_context.createOscillator();
    let u = g.audio_context.createGain();
    v.connect(u);
    v.frequency.value = 880;
    u.gain.value = 0.01;
    v.type = "square";
    u.connect(g.audio_context.destination);
    v.start(g.audio_context.currentTime);
    v.stop(g.audio_context.currentTime + 0.05);
}