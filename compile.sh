#!/bin/bash
export home=`pwd`
if [ ! -d $home/node_modules ]; then echo "!! run npm install first !!"; exit 1; fi

for i in `find node_modules | grep gyp | grep -v build`
do
  cd $home
  cd `dirname $i`
  nw-gyp rebuild --target=0.6.0
done
