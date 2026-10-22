#!/bin/sh
# python-hicheel.html -> index.html: интернэтгүй ангид шууд нээх бүрэн HTML файл
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="mn">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '</head>\n<body>\n'
  cat python-hicheel.html
  printf '\n</body>\n</html>\n'
} > index.html
