box_o_vox_boxland = {
   constants = require 'constants'
}
local log = radiant.log.create_logger('log')
log:error("Box o' Vox Server: Alpha 24 mod")

function box_o_vox_boxland:_on_required_loaded()
    local CustomHeightMapRenderer = require('services.server.world_generation.custom_height_map_renderer')
    local HeightMapRenderer = radiant.mods.require('stonehearth.services.server.world_generation.height_map_renderer')
    radiant.mixin(HeightMapRenderer, CustomHeightMapRenderer)
end

radiant.events.listen_once(radiant,'radiant:required_loaded', box_o_vox_boxland, box_o_vox_boxland._on_required_loaded)

return box_o_vox_boxland