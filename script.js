const debug = true

class Upgrade {
  constructor(name, description, price, run) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.run = run;
    this.owned = false;
  }
}
class Building {
  constructor(name, price, cps) {
    this.name = name;
    this.price = price;
    this.cps = cps;
    this.have = 0;
    this.id = `buy-${this.name.toLowerCase()}`;
    this.html = 
      `
      <div id="${this.id}" class="store-row ${this.name.toLowerCase()} disabled">
        <img class="store-img">
        <div class="store-info">
          <h3>${this.name}</h3>
          <p class="price">${this.price}</p>
        </div>
        <h1 class="have">${this.have}</h1>
      </div>
      `
      $(`#building-store`).html($(`#building-store`).html() + this.html)
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
      moreClicks: new Upgrade("moreClicks", "double cursor production", 100, () => { this.buildings.cursor.cps *= 2 }),
    }
    this.buildings = {
      cursor: new Building("Cursor", 10, 0.1),
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
  buyUpgrade(name) {
    if (!this.canAfford(this.upgrades[name], 1)) return 1
    if(this.upgrades[name].owned = true) return 1
    this.cookies -= this.upgrades[name].price
    this.upgrades[name].run()
    this.upgrades[name].owned = true;

    this.updateCps();
    return 0
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
      $(".row .building-row")
      $(`#buy-${name}`).on("click", (e) => {
        if(!this.buildings[name]) console.error("Building does not exist")
        const building = this.buildings[name]
        building.buy(this, 1)
      });
    }
    for (const name in this.upgrades) {
      const upgrade = this.upgrades[name]
      $(`#buyupgrade-${upgrade.name}`).on("click", (e) => {
        this.buyUpgrade(upgrade.name);
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
