#!/bin/bash
export home=`pwd`
for i in `find node_modules | grep gyp | grep -v build`
do
  cd $home
  cd `dirname $i`
  nw-gyp rebuild --target=0.6.0
done
