export class EventBox
{
    private subscribers: {
        [event: string]: ((data: any) => any)[]
    } = {};
    private dispatching = false;
    private queue: Array<[string, any]> = [];
    
    emit(event: string, data: any)
    {
        this.queue.push([event, data]);
        
        if (this.dispatching)
        {
            return;
        }

        this.dispatching = true;
        this.dispatch();
        this.dispatching = false;
    }
    
    dispatch()
    {
        while (this.queue.length > 0)
        {
            let [event, data] = this.queue.shift()!;
            let subscribers = this.subscribers[event];
            if (!subscribers)
            {
                continue;
            }
            for (let subscriber of subscribers)
            {
                subscriber(data);
            }
        }
    }
    
    subscribe(event: string, subscriber: (data: any) => any)
    {
        if (!this.subscribers[event])
        {
            this.subscribers[event] = [];
        }

        this.subscribers[event].push(subscriber);
    }
}

