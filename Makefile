#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# Makefile: The recipies for building the budget app
#

.PHONY: test coverage coverage_html clean

test:
	cd backend && DB_PATH=":memory:" python3 api.test.py

coverage:
	cd backend && DB_PATH=":memory:" python3 -m coverage run --branch --source=. api.test.py
	cd backend && python3 -m coverage report

coverage_html:
	cd backend && DB_PATH=":memory:" python3 -m coverage run --branch --source=. api.test.py
	cd backend && python3 -m coverage report
	cd backend && python3 -m coverage html

clean:
	rm -f backend/.coverage
	rm -rf backend/htmlconv