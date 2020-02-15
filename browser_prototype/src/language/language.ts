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

class HashMap
{
    private map = new Map<string, any>();
    constructor(init: [IHashable, any][] = [])
    {
        let key, value;
        for ([key, value] of init)
        {
            this.put(key, value);
        }
    }
    put(key: IHashable, value: any): void
    {
        this.map.set(key.hash(), value);
    }
    get(key: IHashable): any
    {
        return this.map.get(key.hash());
    }
}
