import { Elysia, t } from "elysia";

// Define schemas separately BEFORE app instance creation
const itemSchema = t.Object({
  id: t.Numeric(),
  name: t.String(),
});

const createItemSchema = t.Object({
  name: t.String(),
});

// Define the type for the store
interface Store {
  items: { id: number; name: string }[];
  nextId: number;
}

// In-memory store for items
let items: { id: number; name: string }[] = [];
let nextId = 1;

const app = new Elysia()
  .decorate({
    // Explicitly type the 'store' property within the decorate object
    store: {
      items: [] as { id: number; name: string }[],
      nextId: 1,
    } as Store, // <-- Add 'as Store' here
  })
  .model({
    item: itemSchema, // Use the separately defined schema
    createItem: createItemSchema, // Use the separately defined schema
  })
  .get("/", () => "ElysiaJS CRUD In-Memory Example")
  // GET all items
  .get(
    "/items",
    ({ store }) => { // store should now be correctly typed as Store
      return store.items;
    },
    {
      // Use the separately defined schema directly
      response: { schema: t.Array(t.Ref(itemSchema)) }, // Changed from t.Recursive(t.Ref(app.model.item))
    }
  )
  // GET item by ID
  .get(
    "/items/:id",
    ({ store, params: { id } }: { store: Store, params: { id: number } }) => { // Explicitly type store and params
      const item = store.items.find((i) => i.id === id);
      if (!item) {
        return new Response("Item not found", { status: 404 });
      }
      return item;
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      // Use the separately defined schema directly
      response: { schema: t.Ref(itemSchema) }, // Changed from t.Recursive(t.Ref(app.model.item))
    }
  )
  // POST create item
  .post(
    "/items",
    // Explicitly type body and store in the handler signature
    ({ store, body }: { store: Store, body: typeof createItemSchema }) => { // Use Store for store type
      const newItem = { id: store.nextId++, name: body.name };
      store.items.push(newItem);
      return newItem;
    },
    {
      body: t.Ref(createItemSchema), // Use the separately defined schema
      // Use the separately defined schema directly
      response: { schema: t.Ref(itemSchema) }, // Changed from t.Recursive(t.Ref(app.model.item))
    }
  )
  // PUT update item by ID
  .put(
    "/items/:id",
    // Explicitly type body, params, and store in the handler signature
    ({ store, params: { id }, body }: { store: Store, params: { id: number }, body: typeof createItemSchema }) => { // Use Store for store type
      const itemIndex = store.items.findIndex((i) => i.id === id);
      if (itemIndex === -1) {
        return new Response("Item not found", { status: 404 });
      }
      store.items[itemIndex] = { id, name: body.name };
      return store.items[itemIndex];
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      body: t.Ref(createItemSchema), // Use the separately defined schema
      // Use the separately defined schema directly
      response: { schema: t.Ref(itemSchema) }, // Changed from t.Recursive(t.Ref(app.model.item))
    }
  )
  // DELETE item by ID
  .delete(
    "/items/:id",
    // Explicitly type store and params for consistency
    ({ store, params: { id } }: { store: Store, params: { id: number } }) => { // Use Store for store type
      const initialLength = store.items.length;
      store.items = store.items.filter((i) => i.id !== id);
      if (store.items.length === initialLength) {
        return new Response("Item not found", { status: 404 });
      }
      return new Response("Item deleted successfully", { status: 200 });
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    }
  )
  .listen(3000);

export type App = typeof app;
console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
