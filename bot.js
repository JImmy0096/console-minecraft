const mineflayer = require('mineflayer');
const fs = require('fs');
const { performance } = require('perf_hooks');
const { pathfinder, Movements} = require('mineflayer-pathfinder');
const { GoalNear, GoalFollow } = require('mineflayer-pathfinder').goals;
const tpsPlugin = require('mineflayer-tps')(mineflayer);
const { Entity } = require('prismarine-entity');
const pvp = require('mineflayer-pvp').plugin;
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let loginOpts = {
    host: "",
    port: 25565,
    username: "",
    password: "",
    version: ""
}

let owner = '';
const RANGE_GOAL = 1;
let look = false;
let relook = false;

function connect () {
    console.log(`Trying connect to ${loginOpts.host}:${loginOpts.port}`);
    const bot = mineflayer.createBot(loginOpts);
    
    bot.once("login",()=>{
        bot.loadPlugin(tpsPlugin);
        bot.loadPlugin(pathfinder);
        bot.loadPlugin(pvp);
    })
    
    // mineflayer-web-inventory
    // const inventoryViewer = require('mineflayer-web-inventory');
    // inventoryViewer(bot);
    
    const createTime = performance.now();
    bot.on('spawn', ()=> {
        console.log('[Event] spawn');
        rl.on('line', (line) => {   // send input into game
            bot.chat(line);
        })
    
        console.log('Spawning took ' + (performance.now() - createTime).toFixed(2) + ' ms.');
        const mcData = require('minecraft-data')(bot.version);
        const defaultMove = new Movements(bot, mcData);
    
        bot.on('physicTick', ()=> {
            if (look == true) {
                const playerfilter =  (Entity) => Entity.type === 'player';
                const playerEntity = bot.nearestEntity(playerfilter);
                if (!playerEntity) return;
                const pos = playerEntity.position;
                bot.lookAt(pos.offset(0, 1.6, 0));
            }
        })
    
        bot.on('entitySpawn', (entity) => {
            if (entity.name == 'player'){
                // console.log(`附近有玩家生成`);
            }
        })
    
        bot.on('playerJoined', (player) => {
            // console.log(`${player.displayName}(${player.username}) 加入了伺服器!`);
        })
    
        bot.on('chestLidMove', (block) => {
            // console.log(`chestPos: ${block.position}`);
        })
    
        bot.on('message', async (jsonMsg)=> {
            const strMsg = jsonMsg.toString();
            console.log(strMsg);    // log inGameMessage to console
            const op = `${owner} whispers to you: `;
    
            if (strMsg.startsWith(op)) {
                const args = strMsg.slice(op.length).trim().split(/ +/g);
                const msg = args.shift().toLowerCase();
                if (msg == `tps`) {
                    bot.chat(`/msg ${owner} TPS:${bot.getTps()} `);
                } else if (msg == `ping`) {
                    bot.chat(`/msg ${owner} PING: ${bot.player.ping}`);
                } else if (msg == `follow`) {
                    if (look == true) {
                        look == false;
                        relook = true;
                    }
                    const target = bot.players[args[0]]?.entity;
                    if (!target) {
                        bot.chat(`/msg ${owner} can't found ${args[0]}`);
                        return;
                    }
                    
                    defaultMove.scafoldingBlocks = [];
                    // defaultMove.scafoldingBlocks.push(mcData.blocksByName['stone'].id);
                    console.log(defaultMove.scafoldingBlocks);
                    bot.pathfinder.setMovements(defaultMove);
                    const goal = new GoalFollow(target, RANGE_GOAL);
                    bot.pathfinder.setGoal(goal, true);
                    if (relook == true) {
                        look == true;
                        relook == false;
                    }
                } else if (msg == `goto`) {
                    bot.pathfinder.setMovements(defaultMove);
                    bot.pathfinder.setGoal(new GoalNear(args[0], args[1], args[2], RANGE_GOAL));
                } else if (msg == `att`) {
                    const target = bot.player[args[0]];
                    if (!target) {
                        bot.chat(`/msg ${owner} can't find ${args[0]}`);
                    }
                    bot.pvp.attack(target.entity);
                } else if (msg == `stop`) {
                    bot.pathfinder.stop();
                    bot.pvp.stop();
                } else if (msg == `look`) {
                    if (look == false) {
                        look = true;
                        bot.chat(`/msg ${owner} look true`);
                    } else if (look == true) {
                        look = false;
                    }
                } else if (msg == `pos`) {
                    bot.chat(`/msg ${owner} ${bot.entity.position.toString()}`);
                } else if (msg == `yp`) {
                    bot.chat(`/msg ${owner} yaw ${bot.entity.yaw}, pitch: ${bot.entity.pitch}`);
                } else if (msg == `tp`) {
                    bot.entity.position.y += 10;
                }
            }
        })
    })
    
    bot.on("death", () => {
        console.log('[Event] death');
        bot.pathfinder.stop();
    })
    bot.on("kicked", (reason, loggedIn) => {
        console.log('[Event] kicked');
        console.log(`Kicked Reason: ${reason}. \nLogged In?: ${loggedIn}.`);
    })
    bot.on('end', async () => {
        console.log('[Event] end');
        console.log(`與伺服器${loginOpts.host}失去連線`);
        console.clear();
        setTimeout(connect,5000);
    })
    bot.on('error', console.log);

    function attack(){  // Killaura
        setInterval(function () {
            for (let entitiesKey in bot.entities) {
                if (mobsIDs.includes(bot.entities[entitiesKey].entityType) &&
                    bot.entities[entitiesKey].position.distanceTo(bot.entity.position) <= 4.5) {
                    // bot.attack(bot.entities[entitiesKey], false) //set to false to disable move
                    use(bot.entities[entitiesKey],1) //1 use entity
                    entitiesKey = null;
                }
                entitiesKey=null;
            }
        }, 180)
    }

    function drop() {
        setInterval(function (){
        let totemId = mcData.itemsByName.totem_of_undying.id //    Get the correct id
            for (let itemsKey of bot.inventory.items()) {
                // if(itemsKey.type===totemId)return itemsKey=null;
                if (!toolIDs.includes(itemsKey.type)) {
                    if(itemsKey.type !==totemId && !swordid.includes(itemsKey.type)) {
                        bot._client.write("window_click", {
                            windowId: 0,
                            slot: itemsKey.slot,
                            mouseButton: 1,
                            action: 1,
                            mode: 4,
                            item: 0
                        })
                        // itemsKey = null;  //釋放記憶體
                    }
                } else {
                    if (itemsKey.type !== totemId || itemsKey.type !== 903) {    //Keep totem
                        bot.setQuickBarSlot(0)
                    } else {
                        bot._client.write("window_click", {
                            windowId: 0,
                            slot: itemsKey.slot,
                            mouseButton: 0,
                            action: 1,
                            mode: 2,
                            item: 0x00
                        })
                        bot.setQuickBarSlot(0)
                    }
                }
            }
        },1200)
    }

    function use(target,leftClick){  // attack entity
        bot._client.write('use_entity', {
            target: target.id,
            mouse: leftClick, // 1
            sneaking: false
        })
    }
}

function config() {
    fs.access(`./`, fs.R_OK | fs.W_OK, (_err) => {
        fs.open('./config.json', 'r', (err,fd) => {
            if(err) {
                console.log(`Can't find config file, generating...`);
                let data = {
                    "owner": "",
                    "host": "",
                    "port": 25565,
                    "username": "",
                    "password": ""
                }
                data = JSON.stringify(data);
                fs.writeFileSync('./config.json', data, async (err) => {
                    data = null;
                    if (err) return console.log(err);
                    setTimeout(() => {
                        process.exit();
                    }, 3000);
                })
            } else {
                console.log(`Login in...`);
                let json = '';
                fs.readFile(`./config.json`, (err, data) => {
                    try {
                        json = JSON.parse(data.toString());
                        loginOpts.host = json.host;
                        loginOpts.port = json.port;
                        loginOpts.username = json.username;
                        loginOpts.password = json.password;
                        loginOpts.version = json.version;
                        owner = json.owner;
                        json = null;
                        setTimeout(connect,3000);
                    } catch (err) { return console.log(err) }
                })
            }
        })
    })
}

config();

