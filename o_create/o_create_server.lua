o_create = {
   constants = require 'constants'
}
local log = radiant.log.create_logger('log')
log:error("O Create Server: Alpha 24 mod")

function o_create:_on_required_loaded()
    local CustomGameCreationService = require('services.server.game_creation.game_creation_service')
    local GameCreationService = radiant.mods.require('stonehearth.services.server.game_creation.game_creation_service')
    radiant.mixin(GameCreationService, CustomGameCreationService)
end

radiant.events.listen_once(radiant,'radiant:required_loaded', o_create, o_create._on_required_loaded)

return o_create