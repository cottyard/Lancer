interface IDisposable {
    dispose(): void;
}

function using<T extends IDisposable>(resource: T, func: (resource: T) => void) {
    try {
        func(resource);
    } finally {
        resource.dispose();
    }
}

interface IHashable {
    hash(): string;
}

class HashMap<V>
{
    private map = new Map<string, V>();
    constructor(init: [IHashable, V][] = [])
    {
        let key, value;
        for ([key, value] of init)
        {
            this.put(key, value);
        }
    }

    put(key: IHashable, value: V): void
    {
        this.map.set(key.hash(), value);
    }

    get(key: IHashable): V | undefined
    {
        return this.map.get(key.hash());
    }
}
