const App = {
  // les données de l'application
  _state: {
    debug: true,
  },
  // les sélecteurs importants du DOM
  _dom: {
    app: document.querySelector("#app-content"),
    fighters: document.querySelector(".fighters"),
    fights: document.querySelector(".fights"),
  },
  // le dictionnaire de correspondance ID -> Nom du combattant
  fighterMap: {},

  /**
   * Initialisations.
   */
  // coreInit() {
  //   this.HELPERS.log.call(this, "App is starting.");
  //   this.injectDatasFighters();

  //   // Initialiser le map des combattants
  //   this.fighterMap = {};

  //   const fighterForm = document.getElementById("fighterForm");
  //   fighterForm.addEventListener("submit", this.createFighter.bind(this));

  //   const editFighterForm = document.getElementById("editFighterForm");
  //   editFighterForm.addEventListener("submit", this.updateFighter.bind(this));

  //   const fightForm = document.getElementById("fightForm");
  //   fightForm.addEventListener("submit", this.createFight.bind(this));
  // },
  coreInit() {
    this.HELPERS.log.call(this, "App is starting.");
    this.injectDatasFighters();

    this.fighterMap = {};

    const fighterForm = document.getElementById("fighterForm");
    fighterForm.addEventListener("submit", this.createFighter.bind(this));

    const editFighterForm = document.getElementById("editFighterForm");
    editFighterForm.addEventListener("submit", this.updateFighter.bind(this));

    const fightForm = document.getElementById("fightForm");
    fightForm.addEventListener("submit", this.createFight.bind(this));

    // Remplacer l'écouteur du bouton "Choisir un vainqueur aléatoire"
    const randomizeAndCreateFightButton = document.getElementById(
      "randomizeAndCreateFightButton"
    );
    if (randomizeAndCreateFightButton) {
      randomizeAndCreateFightButton.addEventListener("click", () => {
        this.randomizeWinner(); // Choisir le vainqueur et la méthode
        this.createFight(event); // Créer le combat après avoir choisi le vainqueur
      });
    }
  },

  // les méthodes utilitaires regroupées dans la propriété HELPERS
  HELPERS: {
    /**
     * Afficher un message dans la console.
     * @param {string} message
     * @returns
     */
    log(message) {
      if (!this._state.debug) return;
      const CONSOLE_STYLE = "color: blue; font-size: 20px";
      const log_message = `
          ///////////////////////////////////////////
            ${message}
              (c) s5 MMI Angoulême 2024
          ///////////////////////////////////////////
        `;
      console.log(`%c${log_message}`, CONSOLE_STYLE);
    },
  },

  async injectDatasFighters() {
    fetch(`https://mariusyvt.alwaysdata.net/s5/api/v1/fighters`)
      .then((response) => response.json())
      .then((fightersData) => {
        console.log("Combattants :", fightersData);

        // Remplir le map des combattants
        fightersData.forEach((fighter) => {
          this.fighterMap[fighter.id] = fighter.name;
        });

        // 1. Remplir les <select> du formulaire de combat
        const fighter1Select = document.getElementById("fighter1Id");
        const fighter2Select = document.getElementById("fighter2Id");
        const winnerSelect = document.getElementById("winnerFighterId");

        // Ajouter une option vide au début de chaque liste déroulante
        fighter1Select.innerHTML =
          '<option value="">-- Choisir un combattant --</option>';
        fighter2Select.innerHTML =
          '<option value="">-- Choisir un combattant --</option>';
        winnerSelect.innerHTML =
          '<option value="">-- Choisir le gagnant --</option>';

        // Ajouter les options de combattants
        fightersData.forEach((fighter) => {
          const option1 = document.createElement("option");
          option1.value = fighter.id;
          option1.textContent = fighter.name;
          fighter1Select.appendChild(option1);

          const option2 = document.createElement("option");
          option2.value = fighter.id;
          option2.textContent = fighter.name;
          fighter2Select.appendChild(option2);

          const option3 = document.createElement("option");
          option3.value = fighter.id;
          option3.textContent = fighter.name;
          winnerSelect.appendChild(option3);
        });

        // 2. Générer et afficher les cartes de combattants
        const fightersHtml = fightersData
          .map(
            (fighter) => /* HTML */ ` <div
              class="fighter-card"
              data-id="${fighter.id}"
            >
              <div class="card-content">
                <div class="card-header">
                  <h2>${fighter.name}</h2>
                  <p class="nickname">${fighter.nickname}</p>
                </div>

                <div class="fighter-info">
                  <div class="info-row">
                    <span class="label">Âge</span>
                    <span class="value">${fighter.age} ans</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Nationalité</span>
                    <span class="value">${fighter.nationality}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Record</span>
                    <span class="value">${fighter.record}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Équipe</span>
                    <span class="value">${fighter.team}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Catégorie</span>
                    <span class="value">${fighter.weight_class}</span>
                  </div>
                </div>

                <div class="card-actions">
                  <button
                    onclick="App.editFighter(${fighter.id})"
                    class="btn edit-btn"
                  >
                    Modifier
                  </button>
                  <button
                    onclick="App.deleteFighter(${fighter.id})"
                    class="btn delete-btn"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>`
          )
          .join("");

        this._dom.fighters.innerHTML = fightersHtml;

        // Charger et afficher les données de combats
        this.injectDatasFights(this.fighterMap);
      })
      .catch((error) =>
        console.error(
          "Erreur de chargement des données de combattants :",
          error
        )
      );
  },
  async injectDatasFights(fighterMap) {
    fetch(`https://mariusyvt.alwaysdata.net/s5/api/v1/fights`)
      .then((response) => response.json())
      .then((fightsData) => {
        console.log("Combats :", fightsData);

        if (!Array.isArray(fightsData) || fightsData.length === 0) {
          console.log("Aucun combat trouvé.");
          return;
        }

        const fightsHtml = fightsData
          .map((fight) => {
            // Assurez-vous que les combattants existent dans fighterMap
            const fighter1Name = this.fighterMap[fight.fighter1_id];
            const fighter2Name = this.fighterMap[fight.fighter2_id];

            // Si les noms des combattants sont indéfinis, retourner un message d'erreur
            if (!fighter1Name || !fighter2Name) {
              console.error(
                `Erreur: Impossible de trouver un combattant pour l'ID ${fight.fighter1_id} ou ${fight.fighter2_id}`
              );
              return ""; // Ne pas afficher ce combat si les combattants sont introuvables
            }

            // Déterminer le gagnant et le perdant
            const isFighter1Winner = fight.fighter1_id === fight.winner_id;
            const winnerLabel = isFighter1Winner ? "WINNER" : "LOSER";
            const loserLabel = isFighter1Winner ? "LOSER" : "WINNER";
            const method = fight.method || "Méthode inconnue";

            return /* HTML */ `<div
              class="fight-card border rounded p-3 mb-3"
              data-id="${fight.id}"
            >
              <div class="fight-header">
                <h2 class="event-name">${fight.event_name}</h2>
                <p class="fight-date"><strong>Date:</strong> ${fight.date}</p>
              </div>
              <div class="fight-details">
                <div class="fighter fighter-left">
                  <h2>${fighter1Name}</h2>
                </div>
                <div class="fight-info">
                  <div class="decision-label">Décision de l'arbitre</div>
                  <div class="decision-row">
                    <span
                      class="status ${isFighter1Winner ? "winner" : "loser"}"
                      >${winnerLabel}</span
                    >
                    <span class="status method">${method}</span>
                    <span
                      class="status ${isFighter1Winner ? "loser" : "winner"}"
                      >${loserLabel}</span
                    >
                  </div>
                </div>
                <div class="fighter fighter-right">
                  <h2>${fighter2Name}</h2>
                </div>
              </div>

              <button onclick="App.editFight(${fight.id})" class="fighter-edit">
                Modifier
              </button>
              <button
                onclick="App.deleteFight(${fight.id})"
                class="fighter-supp"
              >
                Supprimer
              </button>
            </div>`;
          })
          .join("");

        this._dom.fights.innerHTML = fightsHtml;
      })
      .catch((error) => {
        console.error("Erreur de chargement des combats :", error);
      });
  },

  resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
    }
  },
  async createFighter(event) {
    // créer un nouverau fighters
    event.preventDefault();

    const newFighter = {
      name: document.getElementById("fighterName").value,
      nickname: document.getElementById("fighterNickname").value,
      age: document.getElementById("fighterAge").value,
      nationality: document.getElementById("fighterNationality").value,
      record: document.getElementById("fighterRecord").value,
      team: document.getElementById("fighterTeam").value,
      weight_class: document.getElementById("fighterWeightClass").value,
    };

    try {
      const response = await fetch(
        "https://mariusyvt.alwaysdata.net/s5/api/v1/fighters",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newFighter),
        }
      );

      if (!response.ok) throw new Error("Erreur lors de l'ajout du combattant");

      const responseText = await response.json(); // Traiter la réponse JSO

      if (responseText) {
        console.log("Combattant créé :", responseText);
        this.HELPERS.log.call(this, `Combattant ajouté : ${responseText.name}`);
        this.injectDatasFighters(); // Rafraîchir la liste des combattant
        this.resetForm("fighterForm"); // Réinitialiser le formulaire
      } else {
        throw new Error("Réponse vide reçue du serveur");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  },

  async deleteFighter(fighterId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce combattant ?")) return;

    try {
      const response = await fetch(
        `https://mariusyvt.alwaysdata.net/s5/api/v1/fighters/${fighterId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error("Erreur lors de la suppression du combattant");

      this.HELPERS.log.call(this, `Combattant supprimé : ${fighterId}`);
      this.injectDatasFighters(); // Rafraîchir la liste des combattants
    } catch (error) {
      console.error("Erreur:", error);
    }
  },
  async editFighter(fighterId) {
    try {
      const response = await fetch(
        `https://mariusyvt.alwaysdata.net/s5/api/v1/fighters/${fighterId}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération du combattant");
      }

      const fighter = await response.json(); // Attendre la réponse JSON

      // Trouver la carte du combattant que l'on veut éditer
      const fighterCard = document.querySelector(
        `.fighter-card[data-id="${fighterId}"]`
      );

      // Vérifier si l'élément existe avant de modifier son contenu
      if (!fighterCard) {
        console.error(`Carte de combattant avec ID ${fighterId} non trouvée`);
        return;
      }

      // Créer les inputs et remplir avec les données du combattant
      const fighterHtml = `
        <input type="text" id="editFighterName" value="${fighter.name}">
        <input type="text" id="editFighterNickname" value="${fighter.nickname}">
        <input type="number" id="editFighterAge" value="${fighter.age}">
        <input type="text" id="editFighterNationality" value="${fighter.nationality}">
        <input type="text" id="editFighterRecord" value="${fighter.record}">
        <input type="text" id="editFighterTeam" value="${fighter.team}">
        <input type="text" id="editFighterWeightClass" value="${fighter.weight_class}">
        <button onclick="App.updateFighter(${fighter.id})" class="fighter-edit">Enregistrer</button>
        <button onclick="App.cancelEdit(${fighter.id})" class="fighter-supp">Annuler</button>
      `;

      // Remplacer le contenu de la carte par le formulaire d'édition
      fighterCard.innerHTML = fighterHtml;
    } catch (error) {
      console.error("Erreur lors de la récupération du combattant :", error);
    }
  },
  closeEditForm() {
    document.getElementById("edit-fighter-form").style.display = "none";
  },

  async updateFighter(fighterId) {
    const updatedFighter = {
      name: document.getElementById("editFighterName").value,
      nickname: document.getElementById("editFighterNickname").value,
      age: document.getElementById("editFighterAge").value,
      nationality: document.getElementById("editFighterNationality").value,
      record: document.getElementById("editFighterRecord").value,
      team: document.getElementById("editFighterTeam").value,
      weight_class: document.getElementById("editFighterWeightClass").value,
    };

    try {
      const response = await fetch(
        `https://mariusyvt.alwaysdata.net/s5/api/v1/fighters/${fighterId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedFighter),
        }
      );

      if (!response.ok)
        throw new Error("Erreur lors de la mise à jour du combattant");

      const responseText = await response.json();
      console.log("Combattant mis à jour :", responseText);

      // Rafraîchir les données des combattants
      this.injectDatasFighters();
    } catch (error) {
      console.error("Erreur de mise à jour :", error);
    }
  },

  cancelEdit(fighterId) {
    // Recharger les données pour remettre la carte à son état initial
    this.injectDatasFighters();
  },

  randomizeWinner() {
    const fighter1Id = document.getElementById("fighter1Id").value;
    const fighter2Id = document.getElementById("fighter2Id").value;

    if (!fighter1Id || !fighter2Id) {
      alert(
        "Veuillez sélectionner les deux combattants avant de choisir un vainqueur."
      );
      return;
    }

    // Choisir aléatoirement le vainqueur
    const winnerId = Math.random() < 0.5 ? fighter1Id : fighter2Id;

    // Choisir aléatoirement la méthode de victoire
    const methods = [
      "KO",
      "Décision des juges",
      "Soumission",
      "Abandon",
      "Disqualification",
    ];
    const randomMethod = methods[Math.floor(Math.random() * methods.length)];

    // Mettre à jour le formulaire
    document.getElementById("winnerFighterId").value = winnerId;

    const methodSelect = document.getElementById("methodId");
    const methodOption = document.createElement("option");
    methodOption.value = randomMethod;
    methodOption.textContent = randomMethod;
    methodSelect.innerHTML = ""; // Vider le menu déroulant avant d'ajouter la méthode aléatoire
    methodSelect.appendChild(methodOption);
  },
  randomizeFightOutcome(fighter1Id, fighter2Id) {
    // Sélectionner un combattant aléatoirement
    const winnerId = Math.random() > 0.5 ? fighter1Id : fighter2Id;
    const loserId = winnerId === fighter1Id ? fighter2Id : fighter1Id;

    // Liste des méthodes de victoire possibles
    const methods = [
      "KO",
      "Décision des juges",
      "Soumission",
      "Abandon",
      "Disqualification",
    ];
    // Choisir une méthode aléatoire parmi la liste
    const method = methods[Math.floor(Math.random() * methods.length)];

    return { winnerId, loserId, method };
  },

  async createFight(event) {
    event.preventDefault();

    const fighter1Id = document.getElementById("fighter1Id").value;
    const fighter2Id = document.getElementById("fighter2Id").value;

    let winnerId = document.getElementById("winnerFighterId").value;
    let method = document.getElementById("methodId").value;

    // Si aucun vainqueur ou méthode n'est sélectionné, choisir aléatoirement
    if (!winnerId || !method) {
      const { winnerId: randomWinner, method: randomMethod } =
        this.randomizeFightOutcome(fighter1Id, fighter2Id);
      winnerId = randomWinner;
      method = randomMethod;

      // Mettre à jour les champs avec les valeurs choisies aléatoirement
      document.getElementById("winnerFighterId").value = winnerId;
      document.getElementById("methodId").value = method;
    }

    const newFight = {
      fighter1_id: fighter1Id,
      fighter2_id: fighter2Id,
      event_name: document.getElementById("fightEventName").value,
      date: document.getElementById("fightDate").value,
      winner_id: winnerId,
      method: method,
    };

    try {
      const response = await fetch(
        "https://mariusyvt.alwaysdata.net/s5/api/v1/fights",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newFight),
        }
      );

      if (!response.ok) throw new Error("Erreur lors de la création du combat");

      const responseText = await response.json();
      if (responseText) {
        console.log("Nouveau combat créé :", responseText);
        this.HELPERS.log.call(
          this,
          `Nouveau combat ajouté : ${responseText.event_name}`
        );
        this.injectDatasFights(this.fighterMap); // Rafraîchir la liste des combats
        this.resetForm("fightForm"); // Réinitialiser le formulaire
      } else {
        throw new Error("Réponse vide reçue du serveur");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  },
  async deleteFight(fightId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce combat ?")) return;

    try {
      const response = await fetch(
        `https://mariusyvt.alwaysdata.net/s5/api/v1/fights/${fightId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error("Erreur lors de la suppression du combat");

      console.log(`Combat ${fightId} supprimé`);

      // Rafraîchir la liste des combats après suppression
      this.injectDatasFights(this.fighterMap);
    } catch (error) {
      console.error("Erreur:", error);
    }
  },

  // Dans le fichier front-end App.js
  async editFight(fightId) {
    try {
      const response = await fetch(
        `https://mariusyvt.alwaysdata.net/s5/api/v1/fights/${fightId}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération du combat");
      }

      const fight = await response.json();

      // Trouver la carte du combat que l'on veut éditer
      const fightCard = document.querySelector(
        `.fight-card[data-id="${fightId}"]`
      );

      // Vérifier si l'élément existe avant de modifier son contenu
      if (!fightCard) {
        console.error(`Carte de combat avec ID ${fightId} non trouvée`);
        return;
      }

      // Créer les inputs et remplir avec les données du combat
      const fightHtml = `
        <input type="text" id="editFightEventName" value="${fight.event_name}">
        <input type="datetime-local" id="editFightDate" value="${fight.date}">
        <select id="editFighter1Id">
          ${this.generateFighterOptions(fight.fighter1_id)}
        </select>
        <select id="editFighter2Id">
          ${this.generateFighterOptions(fight.fighter2_id)}
        </select>
        <select id="editWinnerFighterId">
          ${this.generateFighterOptions(fight.winner_id)}
        </select>
        <input type="text" id="editFightMethod" value="${fight.method}">
        <button onclick="App.updateFight(${
          fight.id
        })" class="fighter-edit">Enregistrer</button>
        <button onclick="App.cancelEditFight(${
          fight.id
        })"class="fighter-supp">Annuler</button>
      `;

      // Remplacer le contenu de la carte par le formulaire d'édition
      fightCard.innerHTML = fightHtml;
    } catch (error) {
      console.error("Erreur lors de la récupération du combat :", error);
    }
  },

  // Générer les options pour les combattants dans les menus déroulants
  generateFighterOptions(selectedId) {
    let options = "";
    for (const fighterId in this.fighterMap) {
      const fighterName = this.fighterMap[fighterId];
      const selected = selectedId == fighterId ? "selected" : "";
      options += `<option value="${fighterId}" ${selected}>${fighterName}</option>`;
    }
    return options;
  },

  async updateFight(fightId) {
    const updatedFight = {
      event_name: document.getElementById("editFightEventName").value,
      date: document.getElementById("editFightDate").value,
      fighter1_id: document.getElementById("editFighter1Id").value,
      fighter2_id: document.getElementById("editFighter2Id").value,
      winner_id: document.getElementById("editWinnerFighterId").value,
      method: document.getElementById("editFightMethod").value,
    };

    try {
      const response = await fetch(
        `https://mariusyvt.alwaysdata.net/s5/api/v1/fights/${fightId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedFight),
        }
      );

      if (!response.ok)
        throw new Error("Erreur lors de la mise à jour du combat");

      const responseText = await response.json();
      console.log("Combat mis à jour :", responseText);

      // Rafraîchir la liste des combats
      this.injectDatasFights(this.fighterMap);
    } catch (error) {
      console.error("Erreur de mise à jour :", error);
    }
  },

  cancelEditFight(fightId) {
    // Recharger les données pour remettre la carte à son état initial
    this.injectDatasFights(this.fighterMap);
  },
};

// initialiser l'application quand le DOM est prêt
window.addEventListener("DOMContentLoaded", App.coreInit.bind(App));
