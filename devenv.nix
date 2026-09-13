{ pkgs, lib, config, inputs, ... }:

{
    packages = [ pkgs.git ];
    languages.javascript = {
        enable = true;
        package = pkgs.nodejs_24;
        pnpm = {
            enable = true;
        };
    };
}
