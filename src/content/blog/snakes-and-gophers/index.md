---
title: "Snakes & Gophers — A Python Dev's Guide to Thinking in Go"
description: "You've written Python for years. Now you're picking up Go. This isn't a tutorial — it's a guide to rewiring your instincts."
date: "2026-03-04"
---

You've written Python for years. You can `pip install` your way out of anything. Your decorators are elegant, your list comprehensions are crisp, and you've finally gotten comfortable with `asyncio`. And then someone says — *"we're moving to Go."*

This isn't a Go introduction. If you want that, head to [Go by Example](https://gobyexample.com) — it's the best. I'm also not going to list conceptual differences between Python and Go — you're one search away from that.

This guide is about **rewiring your instincts**. Python and Go look different on the surface, but they *think* differently underneath. And that's where the real adjustment happens.

---

## The Big One: Concurrency

This is the only section that needs real focus. Everything else is honestly just language flavour.

Python has the GIL and the event loop. You've fought with `threading`, embraced `asyncio`, maybe even used `multiprocessing` when things got desperate. Go throws all of that out.

In Go, you have **goroutines** and **channels**. That's it. Goroutines are lightweight threads managed by the Go runtime — you can spin up thousands without breaking a sweat. Channels are how goroutines talk to each other.

Here's what the same "fetch multiple URLs concurrently" pattern looks like:

**Python:**
```python
import asyncio
import aiohttp

async def fetch(session, url):
    async with session.get(url) as resp:
        return await resp.text()

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
```

**Go:**
```go
func fetch(url string, ch chan<- string, wg *sync.WaitGroup) {
    defer wg.Done()
    resp, err := http.Get(url)
    if err != nil {
        ch <- ""
        return
    }
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    ch <- string(body)
}

func main() {
    ch := make(chan string, len(urls))
    var wg sync.WaitGroup
    for _, url := range urls {
        wg.Add(1)
        go fetch(url, ch, &wg)
    }
    go func() { wg.Wait(); close(ch) }()
    for result := range ch {
        fmt.Println(result)
    }
}
```

More code? Yes. But there's no event loop, no `async/await` colouring, and it's *truly parallel* — not just concurrent. Every goroutine can run on a separate CPU core.

### context.Context — The Thing Python Doesn't Have

In Go, `context.Context` gets threaded through *everything*. Every HTTP handler gets one, every database call takes one, every goroutine should respect one. It carries deadlines, cancellation signals, and request-scoped values.

**If you forget to cancel a context, you leak memory.** This is not optional housekeeping — it's a core part of how Go manages resources.

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel() // ALWAYS do this

result, err := db.QueryContext(ctx, "SELECT ...")
```

Think of it as Python's `asyncio.timeout()` meets a request-scoped dependency injection container, except it's a single, explicit argument.

---

## The "No" List

This is the fun part. Here's everything you'll reach for and won't find.

**No `try / except`.** This one is hard to get used to. Errors in Go are values, not exceptions. You'll write `val, err :=` hundreds of times a day. `panic` and `recover` exist for truly exceptional cases, but idiomatic Go treats errors as return values.

```go
file, err := os.Open("config.json")
if err != nil {
    return fmt.Errorf("failed to open config: %w", err)
}
defer file.Close()
```

**No `None`.** Go uses zero values. An uninitialized `string` is `""`, an `int` is `0`, a `bool` is `false`. If you need `None`/`nil` behaviour, use a pointer.

```go
var name string  // "" not None
var count int    // 0 not None
var active *bool // nil — now you can distinguish "not set" from "false"
```

**No default function arguments.** `def foo(x=10)` doesn't exist. The Go patterns are functional options or config structs.

```go
// Instead of default args, use a config struct
type ServerConfig struct {
    Port    int
    Timeout time.Duration
}

func NewServer(cfg ServerConfig) *Server { ... }
```

**No context manager.** No `with open(...) as f:`. Use `defer` instead.

```go
f, err := os.Open("file.txt")
if err != nil { return err }
defer f.Close() // runs when the function returns
```

**No enums.** Yes, really. You use `iota` with a `const` block, and it works, but it's not the same. Check out [this Ardan Labs article](https://www.ardanlabs.com/blog/2023/09/implementing-enumerations-in-golang.html) for patterns.

```go
type Status int

const (
    Pending Status = iota // 0
    Active                // 1
    Closed                // 2
)
```

**No decorators. No lambdas.** Both become closures. `functools.lru_cache` for lazy loading? That's `sync.Once`.

```go
// Decorator pattern → closure
func withLogging(fn func()) func() {
    return func() {
        log.Println("start")
        fn()
        log.Println("end")
    }
}

// sync.Once for one-time initialization (like lru_cache for singletons)
var once sync.Once
var db *sql.DB

func GetDB() *sql.DB {
    once.Do(func() {
        db, _ = sql.Open("postgres", connStr)
    })
    return db
}
```


---

## Pointers — Back to Basics

Python hides references from you. Go makes them explicit. You'll need to think about *value vs reference semantics* again.

The biggest gotcha: Python's slice syntax gives you copies. Go slices share backing memory.

```python
# Python — this creates a new list
copy = original[:]
```

```go
// Go — this shares the underlying array!
copy := original[:]
// Mutation to copy affects original. Use slices.Clone() for a real copy.
```

Quick mapping:
- `list` → slice (or array for fixed-size)
- `dict` → `map`
- If you want a copy, **make one explicitly**

---

## Modules & Imports

Go enforces a **strict DAG** for imports — no circular imports, ever. The compiler will stop you cold.

Coming from Python where circular imports are "just a warning" (or silently work sometimes), this feels restrictive. It's actually a feature — it forces you into clean architecture from day one. Your module structure *has* to be well-organized.

Another difference: **no local or dynamic imports**. In Python, you can `import x` inside a function or use `importlib` based on runtime conditions. In Go, all imports must be at the top of the file, declared statically at compile time.

```python
# Python: "it works... sometimes"
# a.py imports b.py, b.py imports a.py → 🤷
# def foo(): import heavy_module → runtime evaluation

# Go: compiler says no. Imports are static and top-level only.
```

---

## OOP in Go (or: How I Learned to Stop Worrying and Love Composition)

You can achieve everything you did with Python classes — just differently.

**No `class` keyword.** You use structs with methods attached.

```go
type User struct {
    Name  string
    Email string
}

func (u *User) Greet() string {
    return "Hi, I'm " + u.Name
}

// Usage:
func main() {
    u := &User{Name: "Alice", Email: "alice@example.com"}
    fmt.Println(u.Greet()) // "Hi, I'm Alice"
}
```

**No constructor.** Write a factory function. Convention is `NewThing()`.

```go
func NewUser(name, email string) *User {
    return &User{Name: name, Email: email}
}
```

**Encapsulation** works through naming — lowercase is private (package-scoped), Capitalized is public. No underscores, no `__dunder__`, just capitalization.

**Interfaces are implicitly satisfied.** This is actually magical coming from Python's `ABC`. You don't write `implements` — if your struct has the right methods, it satisfies the interface automatically.

```go
type Greeter interface {
    Greet() string
}

// User satisfies Greeter automatically — no "implements" needed
```

**Polymorphism** is interface-based, not inheritance-based. And there IS no inheritance. Composition is the default.

While Go does have a feature called "struct embedding" that mimics inheritance by promoting methods, it's often better to just be explicit. Explicit fields prevent method collisions and make it instantly clear where data lives.

```go
// Explicit composition (the clearer way)
type Admin struct {
    Account     User     // Admin explicitly "has a" User
    Permissions []string
}

func main() {
    a := &Admin{
        Account: User{Name: "Bob", Email: "bob@admin.com"},
        Permissions: []string{"ROOT"},
    }
    
    // Explicit calls mean no ambiguity if both Admin and User had a Greet() method
    fmt.Println(a.Account.Greet()) // "Hi, I'm Bob"
}
```

**No overloading.** Just write another function with a different name. It's simpler and more explicit.



---

## Tooling — You Already Have Everything

In Python, you assemble your toolchain: uv or pip or poetry for packages, black or ruff for formatting, pytest for tests, mypy for types. It's a whole ecosystem.

In Go, you open a terminal:

- `go fmt` — formats your code. It's not optional. There is ONE style.
- `go test` — runs your tests. No pytest, no unittest, no nose.
- `go build` — compiles everything. The compiler IS your type checker.
- `go vet` — catches suspicious constructs.
- `go mod` — dependency management. That's it.

No debates about formatters. No optional type checking. It's all built in, and everyone uses the same thing. After the Python tooling fragmentation, this feels like a warm hug.

---

## Writing Server Code

Once the mindset shift is done, here's the practical stuff.

### SQL: Go Leans Raw

Go leans towards raw SQL or SQL templates over ORMs. Having worked with SQLAlchemy and JinjaSQL, I personally lean towards the template approach — and there are solid Go libraries for SQL templating. Traditional connection pooling, transactions, and prepared statements all apply as normal.

### Validation: Struct Tags, Not Pydantic

Using Pydantic for model validation? In Go, `encoding/json` with struct tags handles JSON decoding. The field naming ties into Go's encapsulation — only `Capitalized` fields get exported/serialized.

```go
type CreateUserRequest struct {
    Name  string `json:"name" validate:"required"`
    Email string `json:"email" validate:"required,email"`
    Age   int    `json:"age"  validate:"gte=0,lte=150"`
}

func handler(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    json.NewDecoder(r.Body).Decode(&req)
}
```

### Frameworks

- **Gin** — mature and popular, the Django/Flask of Go
- **Echo, Fiber, Chi** — lightweight options
- Stdlib `net/http` is more capable than you'd think. Chi specifically follows stdlib patterns.

### More Concurrency Primitives

Beyond goroutines and channels, you'll want:
- `sync.WaitGroup` — waiting for a bunch of goroutines to finish
- `sync.Mutex` — locking shared memory
- `select` statement — multiplexing across multiple channels (like `asyncio.wait` but for channels)

---

## Background Workers

Conceptually, there's not much difference from server code — you're polling for work instead of HTTP requests.

If you're coming from Python:
- **Celery** → asynq, machinery
- **Temporal** → Temporal (it's cross-language, so you might already know it!)

I switched from Celery to Temporal for complex long-running workflows, and the Go SDK is excellent. But regardless of framework, the fundamentals don't change — your message handlers still need to be **idempotent**. No framework saves you from that.

---

## Closing Thoughts

Here's the thing about Go: the "no" list *is* the feature list. No classes, no exceptions, no generics (well, they added them, but the culture still prefers simplicity), no decorators, no magic.

The learning curve isn't about learning Go. It's about **unlearning Python habits** — and realizing that less abstraction often means more clarity.

Start here:
- [Go by Example](https://gobyexample.com) — the best quickstart
- [Effective Go](https://go.dev/doc/effective_go) — the official style guide
- [Ardan Labs Blog](https://www.ardanlabs.com/blog/) — deep dives into Go patterns
