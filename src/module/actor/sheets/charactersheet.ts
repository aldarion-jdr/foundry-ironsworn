import { IronswornRollDialog } from '../../helpers/roll'
import { capitalize } from '../../helpers/util'
import { IronswornActor } from '../actor'
import { IronswornCharacterData } from '../actortypes'

export interface CharacterSheetOptions extends BaseEntitySheet.Options {
  xyz?: string
}

export class IronswornCharacterSheet extends ActorSheet<ActorSheet.Data<IronswornActor>, IronswornActor> {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['ironsworn', 'sheet', 'actor'],
      width: 1200,
      height: 800,
      dragDrop: [{ dragSelector: '.item-list .item', dropSelector: null }],
    } as CharacterSheetOptions)
  }

  get template() {
    return 'systems/foundry-ironsworn/templates/actor/character.hbs'
  }

  activateListeners(html) {
    super.activateListeners(html)

    // Custom sheet listeners for every ItemType
    for (const itemClass of CONFIG.IRONSWORN.itemClasses) {
      itemClass.activateActorSheetListeners(html, this)
    }

    // Custom sheet listeners for every SheetComponent
    // for (const sheetComponent in CONFIG.IRONSWORN.sheetComponents.actor) {
    //   CONFIG.IRONSWORN.sheetComponents.actor[sheetComponent].activateListeners(html, this)
    // }

    html.find('.ironsworn__stat__roll').click((e) => this._onStatRoll.call(this, e))
    html.find('.ironsworn__stat__value').click((e) => this._onStatSet.call(this, e))
    html.find('.ironsworn__momentum__burn').click((e) => this._onBurnMomentum.call(this, e))
  }

  getData() {
    let data: any = super.getData()

    data.builtInMoves = []
    for (const moveName of MOVES) {
      if (moveName.startsWith('---')) {
        data.builtInMoves.push({
          separator: true,
          title: moveName.substr('--- '.length), // TODO: run this through i18n
        })
      } else {
        data.builtInMoves.push({
          title: game.i18n.localize(`IRONSWORN.Moves:${moveName}:title`),
          description: game.i18n.localize(`IRONSWORN.Moves:${moveName}:description`),
        })
      }
    }

    data.customMoves = this.actor.items.filter((x) => x.type === 'move')

    data.assets = this.actor.items.filter((x) => x.type === 'asset')
    data.vows = this.actor.items.filter((x) => x.type === 'vow')
    data.progresses = this.actor.items.filter((x) => x.type === 'progress')
    data.bonds = this.actor.items.find((x) => x.type === 'bondset')

    // Allow every itemtype to add data to the actorsheet
    for (const itemType of CONFIG.IRONSWORN.itemClasses) {
      data = itemType.getActorSheetData(data, this)
    }

    return data
  }

  _getHeaderButtons() {
    return [
      {
        class: 'ironsworn-toggle-edit-mode',
        label: 'Edit',
        icon: 'fas fa-edit',
        onclick: (e) => this._toggleEditMode(e),
      },
      ...super._getHeaderButtons(),
    ]
  }

  async _toggleEditMode(e: JQuery.ClickEvent): Promise<void> {
    e.preventDefault()

    const currentValue = this.actor.getFlag('foundry-ironsworn', 'edit-mode')
    await this.actor.setFlag('foundry-ironsworn', 'edit-mode', !currentValue)
  }

  async _onBurnMomentum(ev) {
    ev.preventDefault()

    const { momentum, momentumReset } = this.actor.data.data as IronswornCharacterData
    if (momentum > momentumReset) {
      await this.actor.update({
        data: { momentum: momentumReset },
      })
    }
  }

  _onStatRoll(ev) {
    ev.preventDefault()

    const el = ev.currentTarget
    const stat = el.dataset.stat
    if (stat) {
      const rollText = game.i18n.localize('IRONSWORN.Roll')
      const statText = game.i18n.localize(`IRONSWORN.${capitalize(stat)}`)
      IronswornRollDialog.showDialog(this.actor.data.data, stat, `${rollText} +${statText}`)
    }
  }

  async _onStatSet(ev) {
    ev.preventDefault()

    const el = ev.currentTarget
    const { resource, value } = el.dataset
    if (resource) {
      // Clicked a value in momentum/health/etc, set the value
      const newValue = parseInt(value)
      const { momentumMax } = this.actor.data.data as IronswornCharacterData
      if (resource !== 'momentum' || newValue <= momentumMax) {
        await this.actor.update({ data: { [resource]: newValue } })
      }
    }
  }
}

const MOVES = [
  '--- Fate',
  'Pay the Price',
  'Ask the Oracle',
  '--- Combat',
  'Enter the Fray',
  'Strike',
  'Clash',
  'Turn the Tide',
  'End the Fight',
  'Battle',
  '--- Adventure',
  'Face Danger',
  'Secure An Advantage',
  'Gather Information',
  'Heal',
  'Resupply',
  'Make Camp',
  'Undertake a Journey',
  'Reach Your Destination',
  '--- Relationship',
  'Compel',
  'Sojourn',
  'Draw the Circle',
  'Forge a Bond',
  'Test Your Bond',
  'Aid Your Ally',
  'Write Your Epilogue',
  '--- Quest',
  'Swear an Iron Vow',
  'Reach a Milestone',
  'Fulfill Your Vow',
  'Forsake Your Vow',
  'Advance',
  '--- Suffer',
  'Endure Harm',
  'Endure Stress',
  'Companion Endure Harm',
  'Face Death',
  'Face Desolation',
  'Out of Supply',
  'Face a Setback',
]
