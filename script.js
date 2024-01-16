const debug = true

class Upgrade {
  constructor(name, description, price, run) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.run = run;

    this.owned = false;

    this.id = `buyupgrade-${this.name.toLowerCase()}`
    this.store_html = 
    `
    <a id="buyupgrade-${this.name.toLowerCase()}" class="upgrade ${this.name.toLowerCase()}" title="${this.description}">
        <div class="upgrade-img"></div>
    </a>
    `
    $(`#upgrade-store`).html($(`#upgrade-store`).html() + this.store_html)
  }

  buy(game) {
    if(game.cookies < (this.price)) return false
    game.cookies -= (this.price)
    this.owned = true
    this.run(game);
    game.updateCps();
    $(`#inventory-${this.name.toLowerCase()}`).append(this.inventory_item_html)

    return true
  }
}
class Building {
  constructor(name, price, cps, inventory_row_enabled=true) {
    this.name = name;
    this.price = price;
    this.cps = cps;
    this.inventory_row_enabled = inventory_row_enabled;

    this.have = 0;

    this.id = `buy-${this.name.toLowerCase()}`;
    this.inventory_id = `inventory-${this.name.toLowerCase()}`

    this.inventory_item_html = 
      `
      <div class="inventory-item ${this.name.toLowerCase()}">
        <img src="https://orteil.dashnet.org/cookieclicker/img/${this.name.toLowerCase()}.png">
      </div>
      `
    this.inventory_html = 
      `
      <div id="${this.inventory_id}" class="inventory-row ${this.name.toLowerCase()}"></div>
      <div class="horizontal-divider"/>
      `
    this.store_html = 
      `
      <div id="${this.id}" class="store-row ${this.name.toLowerCase()} disabled">
        <div class="store-img"></div>
        <div class="store-info">
          <h3>${this.name}</h3>
          <p class="price">${this.price}</p>
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
    $(`#${this.id} .store-info .price`).html(this.price)
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
      moreClicks: new Upgrade("moreClicks", "double cursor production", 100, (game) => { game.buildings.cursor.cps *= 2 }),
    }
    this.buildings = {
      cursor: new Building("Cursor", 10, 0.1, false),
      grandma: new Building("Grandma", 25, 5),
      farm: new Building("Farm", 35, 7),
      mine: new Building("Mine", 500, 15),
      factory: new Building("Factory", 12000, 55),
      bank: new Building("Bank", 30000, 100)
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
    $("#cookies-persecond").html(`${(this.cps).toFixed(1)} cookies per second`)
  }
  updateCookies(options={}) {
    const { amount=this.cps, factor=1 } = options;
    this.cookies += (amount * factor);
    $("#cookie-counter").html(`${Math.floor(this.cookies)} cookies`);
  }
}

// allow the game object to be accessed from the console
let game;
$(document).ready(() => {
  game = new Game();
  game.start()
})
