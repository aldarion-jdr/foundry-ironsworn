import { ActorDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/actorData'
import { IronswornActor } from '../actor/actor'
import { IronswornSettings } from '../helpers/settings'

interface CreateActorDialogOptions extends FormApplication.Options {
  folder: string
}

export class CreateActorDialog extends FormApplication<CreateActorDialogOptions> {
  async _updateObject() {
    // No update necessary.
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: game.i18n.localize('IRONSWORN.CreateActor'),
      template: 'systems/foundry-ironsworn/templates/actor/create.hbs',
      id: 'new-actor-dialog',
      resizable: false,
      classes: ['ironsworn', 'sheet', 'new-actor', `theme-${IronswornSettings.theme}`],
      width: 500,
      height: IronswornSettings.starforgedBeta ? 365 : 200,
    } as FormApplication.Options)
  }

  getData(_options?: Application.RenderOptions): any {
    return {
      sfenabled: IronswornSettings.starforgedBeta
    }
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html)

    html.find('.ironsworn__character__create').on('click', (ev) => this._characterCreate.call(this, ev))
    html.find('.ironsworn__sfcharacter__create').on('click', (ev) => this._sfcharacterCreate.call(this, ev))
    html.find('.ironsworn__sfship__create').on('click', (ev) => this._sfshipCreate.call(this, ev))
    html.find('.ironsworn__shared__create').on('click', (ev) => this._sharedCreate.call(this, ev))
    html.find('.ironsworn__site__create').on('click', (ev) => this._siteCreate.call(this, ev))
  }

  async _characterCreate(ev: JQuery.ClickEvent) {
    ev.preventDefault()

    // Roll an Ironlander name
    const table: any = await this._ironlanderNameTable()
    const drawResult = await table?.draw({ displayChat: false })

    this._createWithFolder(drawResult.results[0]?.data.text || 'Character', 'character', ev.currentTarget.dataset.img || undefined)
  }

  async _sharedCreate(ev: JQuery.ClickEvent) {
    ev.preventDefault()
    this._createWithFolder('Shared', 'shared', ev.currentTarget.dataset.img || undefined)
  }

  async _siteCreate(ev: JQuery.ClickEvent) {
    ev.preventDefault()
    this._createWithFolder('Site', 'site', ev.currentTarget.dataset.img || undefined)
  }

  async _sfcharacterCreate(ev: JQuery.ClickEvent) {
    ev.preventDefault()

    // Roll an Ironlander name
    const name = await this._randomStarforgedName()

    this._createWithFolder(name || 'Character', 'character', ev.currentTarget.dataset.img || undefined, 'ironsworn.StarforgedCharacterSheet')
  }

  async _sfshipCreate(ev: JQuery.ClickEvent) {
    ev.preventDefault()
    this._createWithFolder('Starship', 'starship', ev.currentTarget.dataset.img || undefined)
  }

  async _createWithFolder(name: string, type: 'character' | 'site' | 'shared' | 'starship', img: string, sheetClass?: string) {
    const data: ActorDataConstructorData & Record<string, any> = {
      name,
      img,
      type,
      token: {
        displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
        actorLink: true,
      },
      folder: this.options.folder || undefined,
    }
    if (sheetClass) {
      data.flags = { core: { sheetClass } }
    }
    await IronswornActor.create(data, { renderSheet: true })
    await this.close()
  }

  async _ironlanderNameTable(): Promise<RollTable | undefined> {
    const table = game.tables?.find((x) => x.name === 'Oracle: Ironlander Names')
    if (table) return table

    const pack = game.packs?.get('foundry-ironsworn.ironsworntables')
    const entry = pack?.index.find((x: any) => x.name === 'Oracle: Ironlander Names')
    if (entry) return pack?.getDocument((entry as any)._id) as RollTable | undefined
    return undefined
  }

  async _randomStarforgedName(): Promise<string | undefined> {
    const pack = game.packs.get('foundry-ironsworn.starforgedoracles')
    if (!pack) return undefined

    const firstOid = pack?.index.find((x: any) => x.name === 'Characters / Name / Given Name') as any
    const lastOid = pack?.index.find((x: any) => x.name === 'Characters / Name / Family Name') as any
    if (!firstOid || !lastOid) return undefined

    const firstTable = await pack.getDocument(firstOid._id) as any // really a RollTable
    const lastTable = await pack.getDocument(lastOid._id) as any // really a RollTable
    if (!firstTable || !lastTable) return undefined

    const first = await firstTable.draw({ displayChat: false })
    const last = await lastTable.draw({ displayChat: false })
    return `${first?.results[0]?.data.text} ${last?.results[0]?.data.text}`
  }
}
