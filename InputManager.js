class InputManager
{
  constructor(canvas)
  {
    this.kd = [];
    this.ku = [];
    this.mm = [];
    this.md = [];
    this.mu = [];

    window.oncontextmenu = (e) => { e.preventDefault(); };
    window.onkeydown     = (e) => { this.kd.forEach(fn => fn.fn(e, this, fn.user)); };
    window.onkeyup       = (e) => { this.ku.forEach(fn => fn.fn(e, this, fn.user)); };
    window.onmousemove   = (e) => { this.mm.forEach(fn => fn.fn(e, this, fn.user)); };
    window.onmousedown   = (e) => { this.md.forEach(fn => fn.fn(e, this, fn.user)); };
    window.onmouseup     = (e) => { this.mu.forEach(fn => fn.fn(e, this, fn.user)); };

    this.canvas = canvas;
    this.mouse = {
      x: undefined,
      y: undefined,
      px: undefined,
      py: undefined,
      button: -1
    };

    this.AddMouseMove(e =>
    {
      const r = this.canvas.c.getBoundingClientRect();
      this.mouse.x = e.clientX - r.x;
      this.mouse.y = e.clientY - r.y;
      this.mouse.px = parseInt(this.mouse.x / this.canvas.spsize);
      this.mouse.py = parseInt(this.mouse.y / this.canvas.spsize);
    });
    this.AddMouseDown(e =>
    {
      this.mouse.button = e.button;
    });
  }

  AddKeyUp(fn, user = {})
  {
    this.ku.push({ fn, user });
  }
  AddKeyDown(fn, user = {})
  {
    this.kd.push({ fn, user });
  }
  AddMouseMove(fn, user = {})
  {
    this.mm.push({ fn, user });
  }
  AddMouseUp(fn, user = {})
  {
    this.mu.push({ fn, user });
  }
  AddMouseDown(fn, user = {})
  {
    this.md.push({ fn, user });
  }
}
