

opvp = {
}

-- set the debug flag based on the type of build, or specifc opting in by setting
-- the 'stoneheath.debug' flag
--[[
local service_creation_order = {
   --'alliance'
   'player'
}

local function create_service(name)
   local path = string.format('services.server.%s.%s_service', name, name)
   local service = require(path)()

   local saved_variables = opvp._sv[name]
   if not saved_variables then
      saved_variables = radiant.create_datastore()
      opvp._sv[name] = saved_variables
   end
   service.__saved_variables = saved_variables
   service._sv = saved_variables:get_data()
   saved_variables:set_controller(service)
   saved_variables:set_controller_name('opvp:' .. name)
   service:initialize()
   opvp[name] = service
end

function opvp:_on_required_loaded()
      local CustomPlayerService = require('services.server.player.player_service')
      local PlayerService = radiant.mods.require('stonehearth.services.server.player.player_service')
      radiant.mixin(PlayerService, CustomPlayerService)
end

radiant.events.listen_once(radiant,'radiant:required_loaded', opvp, opvp._on_required_loaded)

radiant.events.listen(opvp, 'radiant:init', function()
      radiant.terrain.initialize(true)
      opvp._sv = opvp.__saved_variables:get_data()
      -- now create all the services
      for _, name in ipairs(service_creation_order) do
         create_service(name)
      end

      radiant.events.trigger_async(radiant, 'radiant:services:init')

   end)
   ]]--
return opvp
