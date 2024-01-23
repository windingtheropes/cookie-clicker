const debug = true

// number formatter
class Num {
  constructor(val) {
    this.value = val
    this.number_names = {
      1_000_000_000_000_000: "quadrillion",
      1_000_000_000_000: "trillion",
      1_000_000_000: "billion",
      1_000_000: "million",
    }
  }

  // test for the biggest number which this.value is greater than to most accurately name it
  findBiggest() {
    let n = undefined;
    for(const num in this.number_names) {
      if(this.value >= parseFloat(num)) {
        n = num
      }
    }
    return n
  }
  named(accuracy = 1) {
    const biggest = this.findBiggest()
    if(!biggest) return this.value
    return `${(this.value / this.findBiggest()).toFixed(accuracy)} ${this.number_names[this.findBiggest()]}` || this.value
  }
}

class Upgrade {
  constructor(name, description, price, run, spriteCoords=[0,0]) {
    this.name = name;
    this.refname = name.toLowerCase().split(" ").join("")
    this.description = description;
    this.price = price;
    this.run = run;
    this.owned = false;

    this.id = `buyupgrade-${this.refname}`
    this.store_html = 
    `
    <a id="${this.id}" class="upgrade ${this.refname}" title="${this.description} | ${this.price} cookies">
        <div class="upgrade-img" style="background: url('https://cdn.dashnet.org/cookieclicker/img/icons.png?v=2.052') -${spriteCoords[0]*48}px -${spriteCoords[1]*48}px;"></div>
    </a>
    `
    $(`#upgrade-store`).html($(`#upgrade-store`).html() + this.store_html)
  }

  buy(game) {
    if(game.cookies < (this.price)) return false
    if(this.owned == true) return false

    game.cookies -= (this.price)
    this.owned = true
    this.run(game);
    game.updateCps();
    $(`#inventory-${this.name.toLowerCase()}`).append(this.inventory_item_html)
    return true
  }
}
class Building {
  constructor(name, price, cps, spriteCoords=[0,0], inventory_row_enabled=true) {
    this.name = name;
    this.refname = name.toLowerCase().split(" ").join("")
    this.price = price;
    this.cps = cps;
    this.inventory_row_enabled = inventory_row_enabled;

    this.have = 0;

    this.id = `buy-${this.refname}`;
    this.inventory_id = `inventory-${this.refname}`

    this.inventory_item_html = 
      `
      <div class="inventory-item ${this.refname}">
        <img src="https://orteil.dashnet.org/cookieclicker/img/${this.refname}.png">
      </div>
      `
    this.inventory_html = 
      `
      <div id="${this.inventory_id}" class="inventory-row ${this.refname}" style="background: url(https://orteil.dashnet.org/cookieclicker/img/${this.refname}Background.png)"></div>
      <div class="horizontal-divider"/>
      `
    this.store_html = 
      `
      <div id="${this.id}" class="store-row ${this.refname} disabled" title="${this.have} ${this.name}(s) producing ${this.cps} cookies per second.">
        <div class="store-img" style="background: url('img/buildings.png') ${spriteCoords[0] * 64}px -${spriteCoords[1] * 64}px;"></div>
        <div class="store-info">
          <h3>${this.name}</h3>
          <p class="price">${new Num(this.price).named()}</p>
        </div>
        <h1 class="have">${this.have}</h1>
      </div>
      `

      // load building html for store and inventory
      if(this.inventory_row_enabled) $(`#building-inventory`).html($(`#building-inventory`).html() + this.inventory_html)
      $(`#building-store`).html($(`#building-store`).html() + this.store_html)
  }
  updatePrice(price) {
    this.price = Math.round(price);  
    $(`#${this.id}`).attr("title", `${this.have} ${this.name}(s) producing ${this.cps} cookies per second.`)
    $(`#${this.id} .store-info .price`).html(new Num(this.price).named())
    return true
  }
  // buy qty of building, given the game object
  buy(game, qty) {
    if(game.cookies < (this.price * qty)) return false
    game.cookies -= (this.price * qty)
    this.have += qty
    $(`#${this.id} .have`).html(this.have)
    this.updatePrice(this.price*game.incfac)
    game.updateCps();
    $(`#inventory-${this.name.toLowerCase()}`).append(this.inventory_item_html)

    return true
  }
}

class Game {
  constructor() {
    this.cookies = 0;
    this.cps_boost = 0; // boost for cookies per second
    this.cpc_boost = 0; // boost for cookies per click
    this.update_interval = 20; // cookie updates per second
    this.incfac = 1.15; // factor by which the price of buildings increases by each purchase
    this.upgrades = {
      moreclicks: new Upgrade("More Clicks", "Double cursor production.", 500, (game) => { game.buildings.cursor.cps *= 2;     game.buildings.cursor.updatePrice(game.buildings.cursor.price);      }, [0,0]),
      prunejuice: new Upgrade("Prune Juice", "Double grandma production.", 50000, (game) => { game.buildings.grandma.cps *= 2;     game.buildings.grandma.updatePrice(game.buildings.grandma.price);      }, [1,0]),
    }
    this.buildings = {
      cursor: new Building("Cursor", 10, 0.1, [0,0] , false),
      grandma: new Building("Grandma", 100, 5, [0,1]),
      farm: new Building("Farm", 1100, 15, [0,3]),
      mine: new Building("Mine", 12000, 55, [0,4]),
      factory: new Building("Factory", 130000, 100, [0,5]),
      bank: new Building("Bank", 1400000, 500, [0,6]),
      temple: new Building("Temple", 20000000, 1500, [0,7]),
      wizardtower: new Building("Wizard Tower", 200000000, 3000, [0,8]),
      shipment: new Building("Shipment", 2000000000, 6000, [0,9]),
    }
  }

  start() {
    this.init();
    
    // cps loop
    setInterval(() => {
      this.updateCookies({factor:1/this.update_interval});
      this.updateStoreRow();
    }, 1000/this.update_interval)

    this.listen()
  }
  init() {
    // load buildings in the store page
    this.updateCps();
    this.updateCookies();
  }
  // check if user can afford obj.price * q
  canAfford(obj, q) {
    if (this.cookies - (obj.price * q) < 0) return false
    return true
  }
  updateStoreRow() {
    for(const b in this.buildings) {
      const building = this.buildings[b]
      if(this.canAfford(building, 1)) {
        $(`#buy-${b}`).removeClass("disabled")
      }
      else {
        $(`#buy-${b}`).addClass("disabled")
      }
    }

    for(const u in this.upgrades) {
      const upgrade = this.upgrades[u]
      if(this.canAfford(upgrade, 1)) {
        $(`#buyupgrade-${u}`).removeClass("disabled")
      }
      else {
        $(`#buyupgrade-${u}`).addClass("disabled")
      }
    }
  }
  get cpc() {
    return 1 + this.cpc_boost;
  }
  // listen for clicks on clickable items
  listen() {
    $("#cookie").on("click", () => {
      this.updateCookies({amount:this.cpc});
    });
    for (const name in this.buildings) {
      $(`#buy-${name.toLowerCase()}`).on("click", (e) => {
        if(!this.buildings[name]) console.error("Building does not exist")
        const building = this.buildings[name]
        building.buy(this, 1)
      });
    }
    for (const name in this.upgrades) {
      $(`#buyupgrade-${name.toLowerCase()}`).on("click", (e) => {
        if(!this.upgrades[name]) console.error("Upgrade does not exist")
        const upgrade = this.upgrades[name]
        upgrade.buy(this)
      });
    }
  }
  // get the current cps based on all cps generators
  get cps() {
    let c = 0;
    for (const b in this.buildings) {
      const building = this.buildings[b]
      c += building.have * building.cps
    }
    return c + this.cps_boost
  }
  boost(factor, duration) {
    console.log(`frenzy starting, factor ${factor}, for ${duration} ms`)
    this.cps_boost = this.cps * factor
    this.cpc_boost = this.cpc * factor
    this.updateCps();
    setTimeout(() => {
      this.cps_boost = 0;
      this.cpc_boost = 0;
      console.log(`frenzy reset`)
      this.updateCps();
    }, duration)
  }
  updateCps() {
    $("#cookies-persecond").html(`${new Num((this.cps).toFixed(1)).named()} cookies per second`)
  }
  updateCookies(options={}) {
    const { amount=this.cps, factor=1 } = options;
    this.cookies += (amount * factor);
    $("#cookie-counter").html(`${new Num(Math.floor(this.cookies)).named()} cookies`);
  }
}

// allow the game object to be accessed from the console
let game;
$(document).ready(() => {
  game = new Game();
  game.start()
})
