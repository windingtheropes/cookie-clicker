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

class Game {
  constructor() {
    this.cookies = 0;
    this.cps_boost = 0;
    this.incfac = 1.15;
    this.upgrades = {
      moreClicks: new Upgrade("moreClicks", "double cursor production", 100, () => { this.buildings.cursor.cps *= 2 })
    }
    this.buildings = {
      cursor: {
        price: 10,
        have: 0,
        cps: 0.1
      },
      grandma: {
        price: 25,
        have: 0,
        cps: 5
      },
      farm: {
        price: 35,
        have: 0,
        cps: 7
      }
    }
  

  }

  start() {
    this.init();
    
    setInterval(() => {
      this.updateCookies();
      this.updateStoreRow();
    }, 1000)
    setInterval(() => {
      this.save();
      console.log("game saved.")
    }, 10000)

    this.listen()
  }
  init() {
    for (let name in this.buildings) this.updatePrice(name)
    this.updateCps();
    this.updateCookies();
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
  updatePrice(name) {
    $(`#buy-${name} .store-info .price`).html(this.buildings[name].price)
    $(`#buy-${name} .have`).html(this.buildings[name].have)
  }
  listen() {
    $("#cookie").on("click", () => {
      this.updateCookies({amount:1});
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
