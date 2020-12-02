class PaletteCache
{
  constructor(canvas)
  {
    this.canvas = canvas;

    this.paletteName = document.getElementById('inputPaletteName');
    this.paletteName.addEventListener('change', this.UpdatePaletteName.bind(this));
    document.getElementById('buttonSavePalette').addEventListener('click', this.SavePalette.bind(this));

    this.input = document.getElementById('inputPaletteFile');
    this.input.addEventListener('change', this.LoadPalette.bind(this));
    this.paletteSelect = document.getElementById('selectPalette');
    this.paletteSelect.addEventListener('change', this.SwitchPalette.bind(this));

    this.blendColor1 = document.getElementById('inputBlendColor1');
    this.blendColor1.addEventListener('change', (e => this.BlendColors(e, 1, false)).bind(this));
    this.blendColor1Display = document.getElementById('inputBlendColor1Display');
    this.blendColor1Display.addEventListener('change', (e => this.BlendColors(e, 1, true)).bind(this));

    this.blendColor2 = document.getElementById('inputBlendColor2');
    this.blendColor2.addEventListener('change', (e => this.BlendColors(e, 2, false)).bind(this));
    this.blendColor2Display = document.getElementById('inputBlendColor2Display');
    this.blendColor2Display.addEventListener('change', (e => this.BlendColors(e, 2, true)).bind(this));

    this.blendCanvas = new Canvas(
      document.getElementById('canvasBlend'),
      Constants.NUM_COLORS, 1,
      { nocache: true, spsize: 20, style: 'border: 1px solid black;' }
    );
    this.blendCanvas.paletteCache = this;



    this.paletteColor = document.getElementById('inputPaletteColor');
    this.paletteColor.addEventListener('change', (e => this.UpdatePaletteColor(e, false)).bind(this));
    this.paletteColorDisplay = document.getElementById('inputPaletteColorDisplay');
    this.paletteColorDisplay.addEventListener('change', (e => this.UpdatePaletteColor(e, true)).bind(this));
    this.copyButton = document.getElementById('buttonPaletteColorCopy');
    this.copyButton.addEventListener('click', (() => navigator.clipboard.writeText(this.paletteColorDisplay.value)).bind(this));

    this.paletteCanvas = new Canvas(
      document.getElementById('canvasPalette'),
      Constants.NUM_COLORS, 1,
      { nocache: true, spsize: 20, style: 'border: 1px solid black;' }
    );
    this.paletteCanvas.paletteCache = this;


    this.display = [];
    for(var i = 0; i < Constants.NUM_COLORS; i++)
    {
      this.display.push(
          Tools.AddUIButton(
            { class: 'color' },
            { click: this.SetCurrentColor.bind(this, i) },
            { textContent: '' + i.toString(16).toUpperCase() }
          )
      );
      if((i + 1) % (Constants.NUM_COLORS / 2) == 0)
        Tools.AddUIBR();
    }
    Tools.AddUIBR();

    this.colorList = [];
    for(var i = 0; i < Constants.NUM_COLORS; i++)
    {
      this.colorList.push(Tools.AddUIInput({ type: 'text', size: 6 }, { change: this.UpdatePalette.bind(this) }, {}, Constants.PALETTE_INPUT_DIV));
      if((i + 1) % (Constants.NUM_COLORS / 2) == 0)
        Tools.AddUIBR(1, Constants.PALETTE_INPUT_DIV);
    }

    this.palettes = [];
    this.currentPalette = new Palette('newPalette',
      [
        new Color(0x000000), new Color(0xffffff), new Color(0xaaaaaa), new Color(0x555555),
        new Color(0xff0000), new Color(0x00ff00), new Color(0x0000ff), new Color(0xffff00),
        new Color(0xff00ff), new Color(0x00ffff), new Color(0x770000), new Color(0x007700),
        new Color(0x000077), new Color(0x777700), new Color(0x770077), new Color(0x007777)
      ]);
    this.UpdateDisplay();
    this.AddPalette(this.currentPalette);
    this.lastCanvasUpdateCoords = { x: 0, y: 0 };
    this.blendColorList = [];
  }

  SwitchPalette()
  {
    this.SetPalette(this.palettes.find(p => p.name === this.paletteSelect.value));
  }

  UpdatePaletteName()
  {
    const option = Tools.ToArray(this.paletteSelect.children).find(c => c.textContent === this.currentPalette.name);
    option.textContent = this.paletteName.value;
    this.currentPalette.SetName(this.paletteName.value);
  }

  RawColorList()
  {
    return this.colorList.map(c => new Color(parseInt(c.value, 16)));
  }

  UpdateCanvases(e)
  {
    const bccoords = this.blendCanvas.RelativeMouse(e);
    const pccoords = this.paletteCanvas.RelativeMouse(e);
    const coords = (bccoords.inBounds ? bccoords : pccoords);
    const canvas = (bccoords.inBounds ? this.blendCanvas : (pccoords.inBounds ? this.paletteCanvas : undefined));
    const list = (canvas === this.paletteCanvas ? this.RawColorList() : this.blendColorList);

    if(!canvas)
      return undefined;

    const spsize = canvas.spsize;
    const x = parseInt(coords.x / spsize);
    const y = parseInt(coords.y / spsize);

    if(coords.inBounds && this.lastCanvasUpdateCoords !== { x, y })
    {
      canvas.Clear();
      if(canvas === this.paletteCanvas)
        this.DrawPaletteColors();
      else
        this.DrawBlendColors();
      canvas.StrokeRect(x, y, list[x].inverseHex);
      this.lastCanvasUpdateCoords = { x, y };
    }

    return list;
  }

  SelectFromCanvases(e)
  {
    const list = this.UpdateCanvases(e);
    if(list)
    {
      navigator.clipboard.writeText(list[this.lastCanvasUpdateCoords.x].hex.substring(1));
      if(list !== this.blendColorList)
        this.SetCurrentColor(this.lastCanvasUpdateCoords.x);
    }
  }

  BlendColors(e, slot, display)
  {
    if(display)
    {
      this['blendColor' + slot].value = '#' + this['blendColor' + slot + 'Display'].value;
      this['blendColor' + slot + 'Display'].value = this['blendColor' + slot + 'Display'].value.toUpperCase();
    }
    else
      this['blendColor' + slot + 'Display'].value = this['blendColor' + slot].value.substring(1).toUpperCase();

      this.DrawBlendColors();
  }

  DrawBlendColors()
  {
    const fg = new Color(parseInt(this.blendColor1Display.value, 16));
    const bg = new Color(parseInt(this.blendColor2Display.value, 16));
    this.blendCanvas.Clear();
    for(var i = 0; i < Constants.NUM_COLORS; i++)
    {
      const color = this.BlendColor(fg, bg, i / (Constants.NUM_COLORS - 1)).hex;
      this.blendCanvas.DrawPixel(i, 0, color);
      this.blendColorList[i] = new Color(parseInt(color.substring(1), 16));
    }
  }

  BlendColor(fg, bg, alpha)
  {
    const ri = 0xff << 16, gi = 0xff << 8, bi = 0xff;

    const r = Math.round(fg.r * alpha + bg.r * (1 - alpha)) & ri;
    const g = Math.round(fg.g * alpha + bg.g * (1 - alpha)) & gi;
    const b = Math.round(fg.b * alpha + bg.b * (1 - alpha)) & bi;

    return new Color(r | g | b);
  }

  UpdatePalette()
  {
    this.colorList.forEach((c, i) =>
    {
      const value = c.value || '000000';
      this.currentPalette.Set(i,  new Color(parseInt(value, 16)));
    });
    this.UpdateDisplay();
    this.DrawPaletteColors();
    if(this.canvas.initialized)
      this.canvas.Draw();
  }

  UpdatePaletteColor(e, display)
  {
    if(display)
      this.paletteColor.value = '#' + this.paletteColorDisplay.value;
    else
      this.paletteColorDisplay.value = this.paletteColor.value.substring(1);
  }

  SetCurrentColor(i)
  {
    if(this.currentPalette)
    {
      this.currentPalette.Select(i);
      this.display.forEach(b => b.setAttribute('class', 'color'));
      this.display[i].setAttribute('class', 'color-selected');
    }
  }

  UpdateDisplay()
  {
    this.display.forEach((b, i) =>
    {
      const c = this.currentPalette.At(i);
      b.style.color = c.inverseHex;
      b.style.backgroundColor = c.hex;
    });

    for(var i = 0; i < Constants.NUM_COLORS; i++)
    {
      const c = this.currentPalette.At(i);

      this.display[i].style.color = c.inverseHex;
      this.display[i].style.backgroundColor = c.hex;

      this.colorList[i].value = c.hex.substring(1);
    }
    this.DrawPaletteColors();
  }

  SetPalette(p)
  {
    this.currentPalette = p;
    this.paletteCanvas.Clear();
    this.DrawPaletteColors();
    this.paletteSelect.value = p.name;
    this.paletteName.value = p.name;
    this.UpdateDisplay();
  }

  DrawPaletteColors()
  {
    for(var i = 0; i < Constants.NUM_COLORS; i++)
      this.paletteCanvas.DrawPixel(i, 0, this.currentPalette.At(i).hex);
  }

  SavePalette()
  {
    this.currentPalette.Save();
  }

  AddPalette(p)
  {
    this.palettes.push(p);
    const option = document.createElement('OPTION');
    option.textContent = p.name;
    this.paletteSelect.appendChild(option);
  }

  LoadPalette(e)
  {
    let file = e.target.files[0];
    let reader = new FileReader();
    let self = this;

    reader.onload = (e) => {
      let data = new Uint8Array(e.target.result);
      let index = 0;

      let nameLength = data[index++];
      let nameBuffer = [];
      for(var i = 0; i < nameLength; i++)
        nameBuffer.push(data[index++]);
      let name = String.fromCharCode(...nameBuffer);

      let temp = [];
      for(var i = 0; i < 16; i++){
        let cur = 0;
        cur |= (data[index++] << 16);
        cur |= (data[index++] << 8);
        cur |= data[index++];
        temp.push(new Color(cur));
      }
      const palette = new Palette(name, temp);
      self.AddPalette(palette);
      self.SetPalette(palette);
      self.paletteName.value = palette.name;
    };
    reader.readAsArrayBuffer(file);
    this.input.value = '';
  }
}
