#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# Makefile: The recipies for building the budget app
#

test:
	cd backend && DB_PATH=":memory:" python3 api.test.py
