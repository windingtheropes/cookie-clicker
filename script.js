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
  }
}

class Game {
  constructor() {
    this.cookies = 0;
    this.cps_boost = 0;
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
    
    setInterval(() => {
      this.updateCookies({factor:1/this.update_interval});
      this.updateStoreRow();
    }, 1000/this.update_interval)
    setInterval(() => {
      this.save();
      console.log("game saved.")
    }, 10000)

    this.listen()
  }
  init() {
    for (const buildingKey in this.buildings) {
      this.addBuilding(this.buildings[buildingKey].name)
      this.updatePrice(this.buildings[buildingKey].name.toLowerCase())
    }
    this.updateCps();
    this.updateCookies();
  }
  addBuilding(name) {
      const buildingHtml = `
      <div id="buy-${name.toLowerCase()}" class="store-row ${name.toLowerCase()} disabled">
        <img class="store-img">
        <div class="store-info">
          <h3>${name}</h3>
          <p class="price">0</p>
        </div>
        <h1 class="have">0</h1>
      </div>
      `
      $("#building-store").html($("#building-store").html() + buildingHtml)
  }
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
  buyBuilding(name, q) {
    if (!this.canAfford(this.buildings[name], q)) return 1

    this.cookies -= this.buildings[name].price
    this.buildings[name].have += q
    this.buildings[name].price = Math.floor(this.buildings[name].price * this.incfac)

    this.updateCps();

    this.updatePrice(name);
    return 0;
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
  get cookies_per_click() {
    const boost = 0;
    return 1 + boost
  }
  updatePrice(name) {
    $(`#buy-${name} .store-info .price`).html(this.buildings[name].price)
    $(`#buy-${name} .have`).html(this.buildings[name].have)
  }
  listen() {
    $("#cookie").on("click", () => {
      this.updateCookies({amount:this.cookies_per_click});
    });
    for (const name in this.buildings) {
      $(".row .building-row")
      $(`#buy-${name}`).on("click", (e) => {
        this.buyBuilding(name, 1);
      });
    }
    for (const name in this.upgrades) {
      const upgrade = this.upgrades[name]
      $(`#buyupgrade-${upgrade.name}`).on("click", (e) => {
        console.log(name)

        this.buyUpgrade(upgrade.name);
      });
    }
  }
  get cps() {
    let c = 0;
    for (const b in this.buildings) {
      const building = this.buildings[b]
      c += building.have * building.cps
    }
    return c + this.cps_boost
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

const game = new Game();
$(document).ready(() => {
  game.start()
})
