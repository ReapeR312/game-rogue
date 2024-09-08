class Game {
  constructor() {
    this.tileWidth = 25;
    this.tileHeight = 25;
    this.fieldWidth = 1025;
    this.fieldHeight = 625;
    this.roomsAndPassages = [];
    this.playerPosition = { x: 0, y: 0 };
    this.playerElement = null;
    this.playerHealth = 100;
    this.playerDamage = 10;
    this.enemies = [];
    this.allTileHP = [];
    this.allTileSW = [];
    this.damageInterval = 1000;
    this.damageAmount = 30;
    this.activeDamageEnemies = new Set();
    this.damageIntervalId = null;
    this.movementIntervals = [];
  }

  getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  isValidCoordinate(x, y) {
    return (
      x >= 0 &&
      y >= 0 &&
      x < Math.floor(this.fieldWidth / this.tileWidth) &&
      y < Math.floor(this.fieldHeight / this.tileHeight)
    );
  }

  isAreaFree(startX, startY, width, height) {
    for (let x = startX; x < startX + width; x++) {
      for (let y = startY; y < startY + height; y++) {
        if (
          !this.isValidCoordinate(x, y) ||
          this.roomsAndPassages.some((cell) => cell.x === x && cell.y === y)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  addToRoomsAndPassages(x, y) {
    if (
      this.isValidCoordinate(x, y) &&
      !this.roomsAndPassages.some((cell) => cell.x === x && cell.y === y)
    ) {
      this.roomsAndPassages.push({ x, y });
    }
  }

  occupyArea(startX, startY, width, height) {
    for (let x = startX; x < startX + width; x++) {
      for (let y = startY; y < startY + height; y++) {
        this.addToRoomsAndPassages(x, y);
      }
    }
  }

  occupyPassageArea(startX, startY, length, isVertical) {
    for (let i = 0; i < length; i++) {
      const x = isVertical ? startX : startX + i;
      const y = isVertical ? startY + i : startY;
      this.addToRoomsAndPassages(x, y);
    }
  }

  createField() {
    for (let x = 0; x < Math.floor(this.fieldWidth / this.tileWidth); x++) {
      for (let y = 0; y < Math.floor(this.fieldHeight / this.tileHeight); y++) {
        jQuery("<div>", {
          class: "tileW",
          css: {
            top: `${y * this.tileHeight}px`,
            left: `${x * this.tileWidth}px`,
            width: `${this.tileWidth}px`,
            height: `${this.tileHeight}px`,
          },
        }).appendTo(".field");
      }
    }
  }

  createRooms() {
    const roomCount = this.getRandomInRange(5, 10);

    for (let i = 0; i < roomCount; i++) {
      let roomWidth, roomHeight, posX, posY;
      do {
        roomWidth = this.getRandomInRange(3, 8);
        roomHeight = this.getRandomInRange(3, 8);
        posX = this.getRandomInRange(
          0,
          Math.floor(this.fieldWidth / this.tileWidth) - roomWidth
        );
        posY = this.getRandomInRange(
          0,
          Math.floor(this.fieldHeight / this.tileHeight) - roomHeight
        );
      } while (!this.isAreaFree(posX, posY, roomWidth, roomHeight));
      this.occupyArea(posX, posY, roomWidth, roomHeight);
      for (let x = 0; x < roomWidth; x++) {
        for (let y = 0; y < roomHeight; y++) {
          jQuery(`<div class='tile'></div>`)
            .css({
              top: `${(posY + y) * this.tileHeight}px`,
              left: `${(posX + x) * this.tileWidth}px`,
              width: `${this.tileWidth}px`,
              height: `${this.tileHeight}px`,
            })
            .appendTo(".field");
        }
      }
    }
  }

  createPassages() {
    const verticalPassages = this.getRandomInRange(3, 5);
    const horizontalPassages = this.getRandomInRange(3, 5);
    for (let i = 0; i < verticalPassages; i++) {
      let startX = this.getRandomInRange(
        0,
        Math.floor(this.fieldWidth / this.tileWidth) - 1
      );

      const passageLength = Math.floor(this.fieldHeight / this.tileHeight);
      this.occupyPassageArea(startX, 0, passageLength, true);
      for (let j = 0; j < passageLength; j++) {
        jQuery('<div class="tile"></div>')
          .css({
            top: `${j * this.tileHeight}px`,
            left: `${startX * this.tileWidth}px`,
            width: `${this.tileWidth}px`,
            height: `${this.tileHeight}px`,
          })
          .appendTo(".field");
      }
    }

    for (let i = 0; i < horizontalPassages; i++) {
      let startY = this.getRandomInRange(
        0,
        Math.floor(this.fieldHeight / this.tileHeight) - 1
      );

      const passageLength = Math.floor(this.fieldWidth / this.tileWidth);
      this.occupyPassageArea(0, startY, passageLength, false);
      for (let j = 0; j < passageLength; j++) {
        jQuery('<div class="tile"></div>')
          .css({
            top: `${startY * this.tileHeight}px`,
            left: `${j * this.tileWidth}px`,
            width: `${this.tileWidth}px`,
            height: `${this.tileHeight}px`,
          })
          .appendTo(".field");
      }
    }
  }

  placeItems() {
    const playerCount = 1;
    const swordCount = 2;
    const potionCount = 10;
    const enemyCount = 10;
    const totalItems = swordCount + potionCount + enemyCount + playerCount;

    if (this.roomsAndPassages.length < totalItems) {
      console.error(
        "Недостаточно клеток для размещения всех предметов! " +
          this.roomsAndPassages.length
      );
      return;
    }

    const placeItem = (itemClass) => {
      if (this.roomsAndPassages.length === 0) {
        console.error(
          "Нет доступных клеток для размещения предметов! " +
            this.roomsAndPassages.length
        );
        return;
      }

      let validPositionFound = false;
      let attempts = 0;

      while (!validPositionFound && attempts < 1000) {
        const index = this.getRandomInRange(
          0,
          this.roomsAndPassages.length - 1
        );
        const { x, y } = this.roomsAndPassages[index];

        if (
          this.roomsAndPassages.some((cell) => cell.x === x && cell.y === y)
        ) {
          const itemElement = jQuery(`<div class='${itemClass}'></div>`)
            .css({
              top: `${y * this.tileHeight}px`,
              left: `${x * this.tileWidth}px`,
              width: `${this.tileWidth}px`,
              height: `${this.tileHeight}px`,
            })
            .attr("data-x", x)
            .attr("data-y", y);

          $(".field").append(itemElement);

          if (itemClass === "tileHP") {
            this.allTileHP.push({ x, y });
          }
          if (itemClass === "tileSW") {
            this.allTileSW.push({ x, y });
          }

          if (itemClass === "tileP") {
            this.playerPosition = { x, y };
            this.playerElement = $(".tileP");
            const playerHealthBar = jQuery(
              '<div class="health-bar"><div class="health-fill"></div></div>'
            ).css({
              position: "absolute",
              top: `${y * this.tileHeight - 10}px`,
              left: `${x * this.tileWidth}px`,
              width: `${this.tileWidth}px`,
              height: "5px",
            });

            $(".field").append(playerHealthBar);
          }
          validPositionFound = true;
        }
        attempts++;
      }

      if (!validPositionFound) {
        console.error(
          "Не удалось найти свободную клетку для размещения предмета. " +
            this.roomsAndPassages.length
        );
      }
    };
    for (let i = 0; i < swordCount; i++) {
      placeItem("tileSW");
    }
    for (let i = 0; i < potionCount; i++) {
      placeItem("tileHP");
    }
    for (let i = 0; i < playerCount; i++) {
      placeItem("tileP");
    }
  }

  movePlayer(dx, dy) {
    const newX = this.playerPosition.x + dx;
    const newY = this.playerPosition.y + dy;

    if (!this.isValidCoordinate(newX, newY)) {
      console.warn(
        `Невозможно переместиться на позицию (${newX}, ${newY}) — вне допустимых границ.`
      );
      return;
    }

    const isFreeCell = this.isCellFree(newX, newY);
    if (!isFreeCell) {
      console.warn(
        `Невозможно переместиться на позицию (${newX}, ${newY}) — клетка занята.`
      );
      return;
    }

    this.updatePlayerPosition(newX, newY);

    if (this.playerElement) {
      this.updatePlayerElementPosition(newX, newY);
      this.updateHealthBarPosition(newX, newY);
      this.checkEnemiesProximity();
      this.checkTileInteractions(newX, newY);
    } else {
      console.error("Элемент игрока не найден.");
    }
  }

  isCellFree(x, y) {
    return this.roomsAndPassages.some((cell) => cell.x === x && cell.y === y);
  }

  updatePlayerPosition(x, y) {
    this.playerPosition.x = x;
    this.playerPosition.y = y;
  }

  updatePlayerElementPosition(x, y) {
    this.playerElement.css({
      top: `${y * this.tileHeight}px`,
      left: `${x * this.tileWidth}px`,
    });
  }

  updateHealthBarPosition(x, y) {
    $(".tileP")
      .siblings(".health-bar")
      .css({
        top: `${y * this.tileHeight - 10}px`,
        left: `${x * this.tileWidth}px`,
      });
  }

  checkTileInteractions(x, y) {
    for (let i = 0; i < this.allTileHP.length; i++) {
      const { x: tileHPx, y: tileHPy } = this.allTileHP[i];
      if (x === tileHPx && y === tileHPy) {
        this.updatePlayerHealth(100);
        this.allTileHP.splice(i, 1);
        $(`.tileHP[data-x="${tileHPx}"][data-y="${tileHPy}"]`).remove();
        break;
      }
    }

    for (let i = 0; i < this.allTileSW.length; i++) {
      const { x: tileSWx, y: tileSWy } = this.allTileSW[i];
      if (x === tileSWx && y === tileSWy) {
        this.playerDamage += 20;
        this.allTileSW.splice(i, 1);
        $(`.tileSW[data-x="${tileSWx}"][data-y="${tileSWy}"]`).remove();
        break;
      }
    }
  }

  initPlayerMovement() {
    jQuery(document).on("keydown", (e) => {
      switch (e.key) {
        case "w":
          this.movePlayer(0, -1);
          break;
        case "a":
          this.movePlayer(-1, 0);
          $(".tileP").css("transform", "scaleX(-1)");
          break;
        case "s":
          this.movePlayer(0, 1);
          break;
        case "d":
          this.movePlayer(1, 0);
          $(".tileP").css("transform", "scaleX(1)");
          break;
        case "ц":
          this.movePlayer(0, -1);
          break;
        case "ф":
          this.movePlayer(-1, 0);
          $(".tileP").css("transform", "scaleX(-1)");
          break;
        case "ы":
          this.movePlayer(0, 1);
          break;
        case "в":
          this.movePlayer(1, 0);
          $(".tileP").css("transform", "scaleX(1)");
          break;
        case " ":
          const { closeEnemiesOneCell, closeEnemiesTwoCell } =
            this.getAdjacentEnemyIndex();
          if (
            closeEnemiesOneCell.length > 0 ||
            closeEnemiesTwoCell.length > 0
          ) {
            this.damage(
              { closeEnemiesOneCell, closeEnemiesTwoCell },
              this.playerDamage
            );
          } else {
            return;
          }
          break;
      }
    });
  }

  createEnemies() {
    const enemyCount = 10;

    for (let i = 0; i < enemyCount; i++) {
      const randomIndex = this.getRandomInRange(
        0,
        this.roomsAndPassages.length - 1
      );
      const { x, y } = this.roomsAndPassages[randomIndex];
      const enemyElement = jQuery('<div class="tileE"></div>')
        .css({
          top: `${y * this.tileHeight}px`,
          left: `${x * this.tileWidth}px`,
          width: `${this.tileWidth}px`,
          height: `${this.tileHeight}px`,
        })
        .appendTo(".field");
      const healthBar = jQuery(
        '<div class="health-bar__enemy"><div class="health-fill__enemy"></div></div>'
      )
        .css({
          top: `${y * this.tileHeight - 10}px`,
          left: `${x * this.tileWidth}px`,
          height: "5px",
          width: `${this.tileWidth}px`,
        })
        .appendTo(".field");
      this.enemies.push({
        x,
        y,
        element: enemyElement,
        healthBar: healthBar,
        health: 100,
        moveEnemyTowardsPlayer: false,
      });
    }
  }

  generateEnemyMove() {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
    ];

    this.enemies.forEach((enemy, index) => {
      if (this.enemies[index].moveEnemyTowardsPlayer === false) {
        const randomDirection =
          directions[this.getRandomInRange(0, directions.length - 1)];
        const { dx, dy } = randomDirection;
        this.updateEnemyPosition(index, dx, dy);
      }
      this.checkEnemiesProximity();
    });
  }

  updateEnemyPosition(enemyIndex, dx, dy) {
    const enemy = this.enemies[enemyIndex];
    if (!this.enemies[enemyIndex]) {
      clearInterval(this.movementIntervals[enemyIndex]);
      this.movementIntervals[enemyIndex] = null;
      return;
    }
    const newX = enemy.x + dx;
    const newY = enemy.y + dy;
    if (
      newX >= 0 &&
      newY >= 0 &&
      newX < Math.floor(this.fieldWidth / this.tileWidth) &&
      newY < Math.floor(this.fieldHeight / this.tileHeight)
    ) {
      const isFreeCell = this.roomsAndPassages.some(
        (cell) => cell.x === newX && cell.y === newY
      );

      if (isFreeCell) {
        this.enemies[enemyIndex].x = newX;
        this.enemies[enemyIndex].y = newY;

        if (enemy.element && enemy.healthBar) {
          enemy.element.css({
            top: `${newY * this.tileHeight}px`,
            left: `${newX * this.tileWidth}px`,
          });

          enemy.healthBar.css({
            top: `${newY * this.tileHeight - 10}px`,
            left: `${newX * this.tileWidth}px`,
          });
        } else {
          console.error(
            `Элемент врага или полоска здоровья отсутствуют для врага ${enemyIndex}.`
          );
        }
      }
    }
  }

  startEnemyMovement() {
    setInterval(() => {
      this.generateEnemyMove();
    }, 1000);
  }

  updatePlayerHealth(amount) {
    this.playerHealth += amount;

    if (this.playerHealth <= 0) {
      this.playerHealth = 0;
      console.log("Игрок погиб");
      this.GameOver();
    }
    if (this.playerHealth >= 100) {
      this.playerHealth = 100;
    }
    const healthPercentage = (this.playerHealth / 100) * 100;
    $(".health-fill").css("width", `${healthPercentage}%`);
  }

  updateHealthBars(enemies) {
    this.enemies.forEach((enemy, index) => {
      let healthPercentage = (enemy.health / 100) * 100;
      enemy.healthBar.css({
        width: (healthPercentage / 100) * 25 + "px",
        height: "5px",
      });
    });
  }

  getAdjacentEnemyIndex() {
    const playerX = this.playerPosition.x;
    const playerY = this.playerPosition.y;

    const directionsOneCell = [
      { dx: 0, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: 1, dy: 1 },
    ];

    const closeEnemiesOneCell = [];
    const closeEnemiesTwoCell = [];

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      for (const { dx, dy } of directionsOneCell) {
        const newX = playerX + dx;
        const newY = playerY + dy;

        if (enemy.x === newX && enemy.y === newY) {
          closeEnemiesOneCell.push(i);
          break;
        }
      }
      for (const { dx, dy } of directionsOneCell) {
        const newX = playerX + dx * 2;
        const newY = playerY + dy * 2;
        if (enemy.x === newX && enemy.y === newY) {
          closeEnemiesTwoCell.push(i);
          break;
        }
      }
    }

    return { closeEnemiesOneCell, closeEnemiesTwoCell };
  }

  damage({ closeEnemiesOneCell, closeEnemiesTwoCell }, damageAmount) {
    for (const id of closeEnemiesOneCell) {
      if (id < 0 || id >= this.enemies.length) continue;

      this.enemies[id].health -= damageAmount;

      if (this.enemies[id].health <= 0) {
        this.enemies[id].healthBar.remove();
        this.enemies[id].element.css("transform", "rotate(-90deg)");
        this.enemies.splice(id, 1);
        if (this.enemies.length === 0) {
          this.GameWin();
        }
      }
    }

    this.updateHealthBars(this.enemies);
  }

  checkEnemiesProximity() {
    const { closeEnemiesTwoCell, closeEnemiesOneCell } =
      this.getAdjacentEnemyIndex();
    for (const index of closeEnemiesOneCell) {
      if (!this.activeDamageEnemies.has(index)) {
        this.activeDamageEnemies.add(index);
        this.startDamageInterval();
        this.moveEnemyTowardsPlayer(index);
      }
    }
    for (const index of closeEnemiesTwoCell) {
      if (!this.activeDamageEnemies.has(index)) {
      }
    }
    for (const index of this.activeDamageEnemies) {
      if (!closeEnemiesOneCell.includes(index)) {
        this.activeDamageEnemies.delete(index);
      }
    }
    if (this.activeDamageEnemies.size === 0 && this.damageIntervalId !== null) {
      clearInterval(this.damageIntervalId);
      this.damageIntervalId = null;
    }
  }

  moveEnemyTowardsPlayer(enemyIndex) {
    const enemy = this.enemies[enemyIndex];
    const playerPosition = this.playerPosition;
    enemy.moveEnemyTowardsPlayer = true;
    const moveEnemy = () => {
      const deltaX = playerPosition.x - enemy.x;
      const deltaY = playerPosition.y - enemy.y;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          this.updateEnemyPosition(enemyIndex, 1, 0);
        } else if (deltaX < 0) {
          this.updateEnemyPosition(enemyIndex, -1, 0);
        }
      } else {
        if (deltaY > 0) {
          this.updateEnemyPosition(enemyIndex, 0, 1);
        } else if (deltaY < 0) {
          this.updateEnemyPosition(enemyIndex, 0, -1);
        }
      }

      this.checkEnemiesProximity();
      if (enemy.x === playerPosition.x && enemy.y === playerPosition.y) {
        clearInterval(this.movementIntervals[enemyIndex]);
      }
    };
    if (this.movementIntervals[enemyIndex]) {
      clearInterval(this.movementIntervals[enemyIndex]);
    }
    this.movementIntervals[enemyIndex] = setInterval(moveEnemy, 1000);
  }

  applyDamage() {
    if (this.damageIntervalId === null) return;
    const damage = this.damageAmount * (this.damageInterval / 1000);
    this.updatePlayerHealth(-damage);
  }

  startDamageInterval() {
    if (this.damageIntervalId === null) {
      this.damageIntervalId = setInterval(() => {
        this.applyDamage();
      }, this.damageInterval);
    }
  }

  GameOver() {
    $(".tileP").siblings(".health-bar").remove();
    $(".tileP").siblings(".health-fill").remove();
    $(".tileP").remove();
    this.movementIntervals.forEach(clearInterval);
    clearInterval(this.damageIntervalId);
    alert("Game Over!");
    setTimeout(() => {
      location.reload();
    }, 3000);
  }

  GameWin() {
    alert("You Win!!!");
    setTimeout(() => {
      location.reload();
    }, 3000);
  }

  init() {
    this.createField();
    this.createRooms();
    this.createPassages();
    this.placeItems();
    this.initPlayerMovement();
    this.createEnemies();
    this.startEnemyMovement();
  }
}

const game = new Game();
game.init();
