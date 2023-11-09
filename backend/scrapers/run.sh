#!/bin/sh
#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# run.sh: This file is used to run all the scrapers
#

export DISPLAY=:0
xset dpms force on
BASEDIR=$(dirname "$0")
cd ${BASEDIR}/..
/usr/bin/python3 insert_transactions.py --log budget.log --config budget.json
xset dpms force off
